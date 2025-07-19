import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Save, Eye } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Switch } from '../components/ui/switch'

interface Question {
  id?: string
  question_text: string
  question_type: 'text' | 'multiple_choice' | 'rating'
  options: string[]
  is_required: boolean
  order_index: number
}

interface FormData {
  id: string
  title: string
  description: string
  is_active: boolean
}

export const EditForm: React.FC = () => {
  const { formId } = useParams<{ formId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [form, setForm] = useState<FormData>({
    id: '',
    title: '',
    description: '',
    is_active: true
  })
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user && formId) {
      loadForm()
    }
  }, [user, formId])

  const loadForm = async () => {
    try {
      setLoading(true)
      setError('')

      // Load form
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .eq('user_id', user?.id)
        .single()

      if (formError) {
        if (formError.code === 'PGRST116') {
          setError('Form not found or you do not have permission to edit it')
        } else {
          setError('Failed to load form')
        }
        return
      }

      setForm(formData)

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('form_id', formId)
        .order('order_index')

      if (questionsError) {
        setError('Failed to load questions')
        return
      }

      setQuestions(questionsData || [])
    } catch (err) {
      console.error('Error loading form:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const addQuestion = () => {
    const newQuestion: Question = {
      question_text: '',
      question_type: 'text',
      options: [],
      is_required: false,
      order_index: questions.length
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...questions]
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value }
    setQuestions(updatedQuestions)
  }

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index)
    // Update order_index for remaining questions
    updatedQuestions.forEach((q, i) => {
      q.order_index = i
    })
    setQuestions(updatedQuestions)
  }

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...questions]
    updatedQuestions[questionIndex].options.push('')
    setQuestions(updatedQuestions)
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions]
    updatedQuestions[questionIndex].options[optionIndex] = value
    setQuestions(updatedQuestions)
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions]
    updatedQuestions[questionIndex].options.splice(optionIndex, 1)
    setQuestions(updatedQuestions)
  }

  const saveForm = async () => {
    try {
      setSaving(true)
      setError('')

      // Validate form
      if (!form.title.trim()) {
        setError('Form title is required')
        return
      }

      if (questions.length === 0) {
        setError('At least one question is required')
        return
      }

      // Validate questions
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i]
        if (!question.question_text.trim()) {
          setError(`Question ${i + 1} text is required`)
          return
        }
        if (question.question_type === 'multiple_choice' && question.options.length < 2) {
          setError(`Question ${i + 1} must have at least 2 options`)
          return
        }
      }

      // Update form
      const { error: formError } = await supabase
        .from('forms')
        .update({
          title: form.title.trim(),
          description: form.description.trim(),
          is_active: form.is_active
        })
        .eq('id', formId)

      if (formError) throw formError

      // Delete existing questions and insert new ones
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('form_id', formId)

      if (deleteError) throw deleteError

      // Insert updated questions
      const questionsToInsert = questions.map((question, index) => ({
        form_id: formId,
        question_text: question.question_text.trim(),
        question_type: question.question_type,
        options: question.options.filter(opt => opt.trim()),
        is_required: question.is_required,
        order_index: index
      }))

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)

      if (questionsError) throw questionsError

      navigate('/forms')
    } catch (err: any) {
      console.error('Error saving form:', err)
      setError(err.message || 'Failed to save form')
    } finally {
      setSaving(false)
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

  if (error && !form.id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold text-foreground mb-4">Error</h1>
          <p className="text-muted-foreground mb-8">{error}</p>
          <Link to="/forms" className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors">
            Back to Forms
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              to="/forms"
              className="flex items-center text-muted-foreground hover:text-foreground transition-colors mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forms
            </Link>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Edit Form</h1>
              <p className="text-muted-foreground">
                Modify your feedback form and questions
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link
                to={`/form/${formId}`}
                target="_blank"
                className="flex items-center bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Link>
              <Button onClick={saveForm} disabled={saving}>
                {saving ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
            {error}
          </div>
        )}

        {/* Form Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Form Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Form Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Enter form title"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Enter form description"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label htmlFor="is_active">Form is active (accepting responses)</Label>
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Questions</CardTitle>
              <Button onClick={addQuestion} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Question {index + 1}</h4>
                  <Button
                    onClick={() => removeQuestion(index)}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div>
                  <Label>Question Text *</Label>
                  <Input
                    value={question.question_text}
                    onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                    placeholder="Enter your question"
                  />
                </div>

                <div>
                  <Label>Question Type</Label>
                  <Select
                    value={question.question_type}
                    onValueChange={(value) => updateQuestion(index, 'question_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="rating">Rating (1-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {question.question_type === 'multiple_choice' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Options</Label>
                      <Button
                        onClick={() => addOption(index)}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Option
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <Input
                            value={option}
                            onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                          <Button
                            onClick={() => removeOption(index, optionIndex)}
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={question.is_required}
                    onCheckedChange={(checked) => updateQuestion(index, 'is_required', checked)}
                  />
                  <Label>Required question</Label>
                </div>
              </div>
            ))}

            {questions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No questions added yet. Click "Add Question" to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
