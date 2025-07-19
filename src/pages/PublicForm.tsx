import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MessageSquare, Send, CheckCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { supabase } from '../lib/supabase'
import { FormData, Question } from '../types/form'

export const PublicForm: React.FC = () => {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormData | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (formId) {
      console.log('Loading form with ID:', formId)
      loadForm()
    }
  }, [formId])

  const loadForm = async () => {
    try {
      setLoading(true)
      setError('')
      console.log('Loading form data for ID:', formId)

      // Load form details
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .eq('is_active', true)
        .single()

      if (formError) {
        console.error('Form loading error:', formError)
        if (formError.code === 'PGRST116') {
          setError('Form not found or is no longer active')
        } else {
          setError('Failed to load form')
        }
        return
      }

      console.log('Form loaded:', formData)

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('form_id', formId)
        .order('order_index')

      if (questionsError) {
        console.error('Questions loading error:', questionsError)
        setError('Failed to load form questions')
        return
      }

      console.log('Questions loaded:', questionsData)
      setForm(formData)
      setQuestions(questionsData || [])
    } catch (err) {
      console.error('Unexpected error loading form:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId: string, value: string) => {
    console.log('Answer changed:', { questionId, value })
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const validateForm = () => {
    const requiredQuestions = questions.filter(q => q.is_required)
    const missingAnswers = requiredQuestions.filter(q => {
      const answer = answers[q.id]
      // Check if answer exists and is not empty
      if (!answer) return true
      // For text questions, check if trimmed value is not empty
      if (q.question_type === 'text' && !answer.trim()) return true
      // For other question types (rating, multiple_choice), just check if value exists
      return false
    })
    
    if (missingAnswers.length > 0) {
      const missingQuestionNumbers = missingAnswers.map(q => {
        const index = questions.findIndex(question => question.id === q.id)
        return index + 1
      })
      setError(`Please answer all required questions. Missing: Question ${missingQuestionNumbers.join(', ')}`)
      return false
    }

    setError('') // Clear any previous errors
    return true
  }

  const submitForm = async () => {
    console.log('Form submission started')
    console.log('Current answers:', answers)
    
    if (!validateForm()) {
      console.log('Form validation failed')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      console.log('Creating response record...')

      // Create response record
      const { data: response, error: responseError } = await supabase
        .from('responses')
        .insert({
          form_id: formId,
          ip_address: null, // Could be populated server-side
          user_agent: navigator.userAgent
        })
        .select()
        .single()

      if (responseError) {
        console.error('Response creation error:', responseError)
        throw responseError
      }

      console.log('Response created:', response)

      // Create answer records - improved filtering
      const answersToInsert = Object.entries(answers)
        .filter(([questionId, value]) => {
          // Only include answers that have actual values
          if (!value) return false
          // For text answers, check if trimmed value is not empty
          const question = questions.find(q => q.id === questionId)
          if (question?.question_type === 'text') {
            return value.trim().length > 0
          }
          // For rating and multiple choice, any non-empty value is valid
          return true
        })
        .map(([questionId, answerText]) => ({
          response_id: response.id,
          question_id: questionId,
          answer_text: typeof answerText === 'string' ? answerText.trim() : answerText.toString()
        }))

      console.log('Answers to insert:', answersToInsert)

      if (answersToInsert.length > 0) {
        const { error: answersError } = await supabase
          .from('answers')
          .insert(answersToInsert)

        if (answersError) {
          console.error('Answers creation error:', answersError)
          throw answersError
        }
      }

      console.log('Form submitted successfully')
      setSubmitted(true)
    } catch (err: any) {
      console.error('Form submission error:', err)
      let errorMessage = 'Failed to submit form. Please try again.'
      
      // Provide more specific error messages
      if (err.message) {
        if (err.message.includes('violates row-level security')) {
          errorMessage = 'Unable to submit form. Please check if the form is still active.'
        } else if (err.message.includes('duplicate key')) {
          errorMessage = 'This response has already been submitted.'
        } else if (err.message.includes('foreign key')) {
          errorMessage = 'Form configuration error. Please contact support.'
        } else {
          errorMessage = `Submission failed: ${err.message}`
        }
      }
      
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading form...</p>
        </div>
      </div>
    )
  }

  if (error && !form) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-destructive/10 p-8 rounded-full w-32 h-32 mx-auto mb-8 flex items-center justify-center">
            <MessageSquare className="h-16 w-16 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">Form Not Available</h1>
          <p className="text-muted-foreground mb-8">{error}</p>
          <Button onClick={() => navigate('/')} variant="outline">
            Go to Homepage
          </Button>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-green-100 dark:bg-green-900/30 p-8 rounded-full w-32 h-32 mx-auto mb-8 flex items-center justify-center">
            <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">Thank You!</h1>
          <p className="text-muted-foreground mb-8">
            Your feedback has been submitted successfully. We appreciate your time and input.
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            Go to Homepage
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-primary p-4 rounded-2xl shadow-lg">
              <MessageSquare className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">FeedbackFlow</h1>
          <p className="text-muted-foreground">Share your valuable feedback</p>
        </div>

        {/* Form */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl">{form?.title}</CardTitle>
            {form?.description && (
              <p className="text-muted-foreground text-lg">{form.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {questions.map((question, index) => (
              <div key={question.id} className="space-y-3">
                <Label className="text-base font-medium">
                  {index + 1}. {question.question_text}
                  {question.is_required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>

                {question.question_type === 'text' && (
                  <Textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Your answer..."
                    className="min-h-[100px]"
                  />
                )}

                {question.question_type === 'multiple_choice' && (
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id={`${question.id}-${optionIndex}`}
                          name={`question-${question.id}`}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <label
                          htmlFor={`${question.id}-${optionIndex}`}
                          className="text-sm font-medium text-foreground cursor-pointer"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {question.question_type === 'rating' && (
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => handleAnswerChange(question.id, rating.toString())}
                        className={`h-12 w-12 rounded-lg border-2 text-sm font-medium transition-colors ${
                          answers[question.id] === rating.toString()
                            ? 'border-primary bg-primary text-white'
                            : 'border-input bg-background hover:border-primary hover:bg-primary/10'
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                    <div className="flex items-center ml-4 text-sm text-muted-foreground">
                      <span>1 = Poor, 5 = Excellent</span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="pt-6 border-t space-y-4">
              <Button
                onClick={submitForm}
                disabled={submitting}
                className="w-full"
                size="lg"
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Send className="h-4 w-4 mr-2" />
                    Submit Feedback
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}