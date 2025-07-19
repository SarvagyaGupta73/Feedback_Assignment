import React from 'react'
import { useState, useEffect } from 'react'
import { BarChart3, Download, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export const Responses: React.FC = () => {
  const { user } = useAuth()
  const [responses, setResponses] = useState<any[]>([])
  const [forms, setForms] = useState<any[]>([])
  const [selectedForm, setSelectedForm] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [stats, setStats] = useState({
    totalResponses: 0,
    thisWeek: 0,
    avgRating: 0
  })

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      // Load user's forms
      const { data: formsData, error: formsError } = await supabase
        .from('forms')
        .select('id, title')
        .eq('user_id', user?.id)

      if (formsError) throw formsError
      setForms(formsData || [])

      // Load responses with form and question details
      const { data: responsesData, error: responsesError } = await supabase
        .from('responses')
        .select(`
          id,
          submitted_at,
          forms!inner(id, title, user_id),
          answers(
            answer_text,
            questions(question_text, question_type)
          )
        `)
        .eq('forms.user_id', user?.id)
        .order('submitted_at', { ascending: false })

      if (responsesError) throw responsesError

      // Transform responses data
      const transformedResponses = responsesData?.map(response => ({
        id: response.id,
        formTitle: response.forms.title,
        formId: response.forms.id,
        submittedAt: response.submitted_at,
        answers: response.answers.reduce((acc: any, answer: any) => {
          acc[answer.questions.question_text] = answer.answer_text
          return acc
        }, {})
      })) || []

      setResponses(transformedResponses)

      // Calculate stats
      const totalResponses = transformedResponses.length
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      
      const thisWeekResponses = transformedResponses.filter(
        r => new Date(r.submittedAt) > oneWeekAgo
      ).length

      // Calculate average rating from rating questions
      const ratingAnswers = transformedResponses.flatMap(r => 
        Object.values(r.answers).filter((answer: any) => 
          /^[1-5]$/.test(answer.toString())
        ).map(Number)
      )
      
      const avgRating = ratingAnswers.length > 0 
        ? ratingAnswers.reduce((sum, rating) => sum + rating, 0) / ratingAnswers.length
        : 0

      setStats({
        totalResponses,
        thisWeek: thisWeekResponses,
        avgRating: Math.round(avgRating * 10) / 10
      })

    } catch (err) {
      setError('Failed to load responses')
      console.error('Error loading responses:', err)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (responses.length === 0) return

    // Get all unique questions across all responses
    const allQuestions = new Set<string>()
    responses.forEach(response => {
      Object.keys(response.answers).forEach(question => {
        allQuestions.add(question)
      })
    })

    const headers = ['Form Title', 'Submitted At', ...Array.from(allQuestions)]
    const csvContent = [
      headers.join(','),
      ...responses.map(response => [
        `"${response.formTitle}"`,
        new Date(response.submittedAt).toLocaleString(),
        ...Array.from(allQuestions).map(question => 
          `"${response.answers[question] || ''}"`
        )
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'feedback-responses.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const filteredResponses = responses.filter(response => {
    const matchesForm = selectedForm === 'all' || response.formId === selectedForm
    const matchesSearch = searchTerm === '' || 
      response.formTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      Object.values(response.answers).some((answer: any) => 
        answer.toLowerCase().includes(searchTerm.toLowerCase())
      )
    return matchesForm && matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading responses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-slide-up">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Response Analytics</h1>
            <p className="text-gray-600 dark:text-gray-300">
              View and analyze feedback responses from all your forms
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={exportToCSV}
              disabled={responses.length === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 inline-flex items-center transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slide-up">
          {[
            { label: 'Total Responses', value: stats.totalResponses.toString(), change: '+12%' },
            { label: 'This Week', value: stats.thisWeek.toString(), change: '+8%' },
            { label: 'Avg. Rating', value: stats.avgRating > 0 ? stats.avgRating.toString() : 'N/A', change: '+0.3' }
          ].map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">{stat.change}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 mb-6 animate-slide-up">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="h-5 w-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search responses..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            <select 
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option>All Forms</option>
              {forms.map(form => (
                <option key={form.id} value={form.id}>{form.title}</option>
              ))}
            </select>
            <select className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option>Last 30 days</option>
              <option>Last 7 days</option>
              <option>Last 3 months</option>
              <option>All time</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Responses List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-up">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Responses</h2>
          </div>
          
          {filteredResponses.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredResponses.map((response) => (
                <div key={response.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{response.formTitle}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Submitted {new Date(response.submittedAt).toLocaleDateString()} at{' '}
                        {new Date(response.submittedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {Object.entries(response.answers).map(([question, answer], index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{question}</p>
                        <p className="text-gray-900 dark:text-white font-medium">{answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-8 w-32 h-32 mx-auto mb-8 flex items-center justify-center animate-bounce-subtle">
                <BarChart3 className="h-16 w-16 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {responses.length === 0 ? 'No responses yet' : 'No matching responses'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {responses.length === 0 
                  ? 'Responses will appear here once people start submitting your forms.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}