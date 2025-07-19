import React from 'react'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FileText, ExternalLink, MoreVertical, Copy, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export const Forms: React.FC = () => {
  const { user } = useAuth()
  const [forms, setForms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      loadForms()
    }
  }, [user])

  const loadForms = async () => {
    try {
      setLoading(true)
      setError('')

      // Load forms with response counts
      const { data: formsData, error: formsError } = await supabase
        .from('forms')
        .select(`
          *,
          responses(count)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (formsError) {
        throw formsError
      }

      // Transform data to include response count and generate URLs
      const transformedForms = formsData?.map(form => ({
        ...form,
        responses: form.responses?.[0]?.count || 0,
        url: `${window.location.origin}/form/${form.id}`,
        status: form.is_active ? 'active' : 'draft'
      })) || []

      setForms(transformedForms)
    } catch (err) {
      setError('Failed to load forms')
      console.error('Error loading forms:', err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    // TODO: Add toast notification
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading forms...</p>
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
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Feedback Forms</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Create and manage your feedback forms
            </p>
          </div>
          <Link
            to="/forms/new"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 inline-flex items-center transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Form
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Forms Grid */}
        {forms.length > 0 ? (
          <div className="grid gap-6 animate-slide-up">
            {forms.map((form) => (
              <div
                key={form.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mr-3">
                        {form.title}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          form.status === 'active'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                        }`}
                      >
                        {form.status}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{form.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                      <span>{form.responses} responses</span>
                      <span>Created {new Date(form.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="mt-4 flex items-center space-x-2">
                      <input
                        type="text"
                        value={form.url}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={() => copyToClipboard(form.url)}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                        title="Copy link"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <a
                        href={form.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                        title="Open form"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      to={`/forms/${form.id}/responses`}
                      className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/40 dark:hover:to-blue-700/40 transition-all duration-300 text-sm font-medium"
                    >
                      View Responses
                    </Link>
                    <Link
                      to={`/forms/${form.id}/edit`}
                      className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                    >
                      Edit
                    </Link>
                    <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-8 w-32 h-32 mx-auto mb-8 flex items-center justify-center animate-bounce-subtle">
              <FileText className="h-16 w-16 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No forms yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-10 max-w-md mx-auto text-lg">
              Create your first feedback form to start collecting valuable insights from your customers.
            </p>
            <Link
              to="/forms/new"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 inline-flex items-center transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Form
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}