import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, BarChart3, Download, Calendar, MessageSquare } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface FormResponse {
  id: string
  submitted_at: string
  ip_address: string | null
  user_agent: string | null
  answers: {
    question_text: string
    question_type: string
    answer_text: string
    order_index: number
  }[]
}

interface FormData {
  id: string
  title: string
  description: string
  created_at: string
}

export const FormResponses: React.FC = () => {
  const { formId } = useParams<{ formId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [form, setForm] = useState<FormData | null>(null)
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    totalResponses: 0,
    avgRating: 0
  })

  useEffect(() => {
    if (user && formId) {
      loadFormAndResponses()
    }
  }, [user, formId])

  const loadFormAndResponses = async () => {
    try {
      setLoading(true)
      setError('')

      // First, load the form to verify ownership
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('id, title, description, created_at, user_id')
        .eq('id', formId)
        .eq('user_id', user?.id)
        .single()

      if (formError) {
        if (formError.code === 'PGRST116') {
          setError('Form not found or you do not have permission to view it')
        } else {
          setError('Failed to load form')
        }
        return
      }

      setForm(formData)

      // Load responses with answers and questions
      const { data: responsesData, error: responsesError } = await supabase
        .from('responses')
        .select(`
          id,
          submitted_at,
          ip_address,
          user_agent,
          answers(
            answer_text,
            questions(
              question_text,
              question_type,
              order_index
            )
          )
        `)
        .eq('form_id', formId)
        .order('submitted_at', { ascending: false })

      if (responsesError) {
        console.error('Error loading responses:', responsesError)
        setError('Failed to load responses')
        return
      }

      // Transform the data
      const transformedResponses: FormResponse[] = responsesData?.map(response => ({
        id: response.id,
        submitted_at: response.submitted_at,
        ip_address: response.ip_address,
        user_agent: response.user_agent,
        answers: response.answers
          .map((answer: any) => ({
            question_text: answer.questions.question_text,
            question_type: answer.questions.question_type,
            answer_text: answer.answer_text,
            order_index: answer.questions.order_index
          }))
          .sort((a: any, b: any) => a.order_index - b.order_index)
      })) || []

      setResponses(transformedResponses)

      // Calculate stats
      const totalResponses = transformedResponses.length
      
      // Calculate average rating from rating questions
      const ratingAnswers = transformedResponses.flatMap(r => 
        r.answers
          .filter(answer => answer.question_type === 'rating')
          .map(answer => parseInt(answer.answer_text))
          .filter(rating => !isNaN(rating))
      )
      
      const avgRating = ratingAnswers.length > 0 
        ? ratingAnswers.reduce((sum, rating) => sum + rating, 0) / ratingAnswers.length
        : 0

      setStats({
        totalResponses,
        avgRating: Math.round(avgRating * 10) / 10
      })

    } catch (err) {
      console.error('Error loading form and responses:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const exportResponses = () => {
    if (responses.length === 0) return

    // Create CSV content
    const headers = ['Response ID', 'Submitted At', 'IP Address']
    const questionHeaders = responses[0]?.answers.map(answer => answer.question_text) || []
    const csvHeaders = [...headers, ...questionHeaders]

    const csvRows = responses.map(response => {
      const baseData = [
        response.id,
        new Date(response.submitted_at).toLocaleString(),
        response.ip_address || 'N/A'
      ]
      const answerData = response.answers.map(answer => `"${answer.answer_text.replace(/"/g, '""')}"`)
      return [...baseData, ...answerData]
    })

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.join(','))
      .join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form?.title || 'form'}-responses.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading responses...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-destructive/10 p-8 rounded-full w-32 h-32 mx-auto mb-8 flex items-center justify-center">
            <MessageSquare className="h-16 w-16 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">Error</h1>
          <p className="text-muted-foreground mb-8">{error}</p>
          <button 
            onClick={() => navigate('/forms')} 
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Forms
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {form?.title} - Responses
              </h1>
              <p className="text-muted-foreground">
                {form?.description}
              </p>
            </div>
            
            <button
              onClick={exportResponses}
              disabled={responses.length === 0}
              className="flex items-center bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card text-card-foreground p-6 rounded-lg border">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-sm text-muted-foreground">Total Responses</p>
                <p className="text-2xl font-bold">{stats.totalResponses}</p>
              </div>
            </div>
          </div>
          
          {stats.avgRating > 0 && (
            <div className="bg-card text-card-foreground p-6 rounded-lg border">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-primary mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                  <p className="text-2xl font-bold">{stats.avgRating}/5</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Responses */}
        {responses.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">
              All Responses ({responses.length})
            </h2>
            
            {responses.map((response, index) => (
              <div key={response.id} className="bg-card text-card-foreground p-6 rounded-lg border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Response #{index + 1}</h3>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(response.submitted_at).toLocaleString()}
                  </div>
                </div>
                
                <div className="space-y-4">
                  {response.answers.map((answer, answerIndex) => (
                    <div key={answerIndex} className="border-l-4 border-primary/20 pl-4">
                      <p className="font-medium text-foreground mb-1">
                        {answer.question_text}
                      </p>
                      <p className="text-muted-foreground">
                        {answer.question_type === 'rating' ? (
                          <span className="inline-flex items-center">
                            {answer.answer_text}/5 
                            <span className="ml-2">
                              {'★'.repeat(parseInt(answer.answer_text))}
                              {'☆'.repeat(5 - parseInt(answer.answer_text))}
                            </span>
                          </span>
                        ) : (
                          answer.answer_text
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-muted p-8 rounded-full w-32 h-32 mx-auto mb-8 flex items-center justify-center">
              <MessageSquare className="h-16 w-16 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">No responses yet</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Share your form link to start collecting responses from your audience.
            </p>
            <Link
              to="/forms"
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Back to Forms
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
