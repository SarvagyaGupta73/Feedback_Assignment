import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Eye, Save } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Switch } from '../components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Separator } from '../components/ui/separator'
import { QuestionEditor } from '../components/FormBuilder/QuestionEditor'
import { FormPreview } from '../components/FormBuilder/FormPreview'
import { FormData, Question } from '../types/form'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export const CreateForm: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    is_active: true,
    questions: [],
  })

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      question_text: '',
      question_type: 'text',
      options: [],
      is_required: true,
      order_index: formData.questions.length,
    }
    updateFormData({
      questions: [...formData.questions, newQuestion]
    })
  }

  const updateQuestion = (questionId: string, updates: Question) => {
    updateFormData({
      questions: formData.questions.map(q => 
        q.id === questionId ? updates : q
      )
    })
  }

  const deleteQuestion = (questionId: string) => {
    const filteredQuestions = formData.questions
      .filter(q => q.id !== questionId)
      .map((q, index) => ({ ...q, order_index: index }))
    
    updateFormData({ questions: filteredQuestions })
  }

  const moveQuestion = (questionId: string, direction: 'up' | 'down') => {
    const questions = [...formData.questions]
    const currentIndex = questions.findIndex(q => q.id === questionId)
    
    if (currentIndex === -1) return
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    if (newIndex < 0 || newIndex >= questions.length) return
    
    // Swap questions
    [questions[currentIndex], questions[newIndex]] = [questions[newIndex], questions[currentIndex]]
    
    // Update order indices
    questions.forEach((q, index) => {
      q.order_index = index
    })
    
    updateFormData({ questions })
  }

  const saveForm = async () => {
    if (!user) return
    
    setSaving(true)
    setError('')

    try {
      // Validate form
      if (!formData.title.trim()) {
        throw new Error('Form title is required')
      }

      if (formData.questions.length === 0) {
        throw new Error('At least one question is required')
      }

      // Check for empty questions
      const emptyQuestions = formData.questions.filter(q => !q.question_text.trim())
      if (emptyQuestions.length > 0) {
        throw new Error('All questions must have text')
      }

      // Check for multiple choice questions without options
      const invalidMultipleChoice = formData.questions.filter(
        q => q.question_type === 'multiple_choice' && q.options.filter(opt => opt.trim()).length === 0
      )
      if (invalidMultipleChoice.length > 0) {
        throw new Error('Multiple choice questions must have at least one option')
      }

      // Create form in database
      const { data: form, error: formError } = await supabase
        .from('forms')
        .insert({
          user_id: user.id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          is_active: formData.is_active,
        })
        .select()
        .single()

      if (formError) throw formError

      // Create questions
      const questionsToInsert = formData.questions.map(q => ({
        form_id: form.id,
        question_text: q.question_text.trim(),
        question_type: q.question_type,
        options: q.question_type === 'multiple_choice' ? q.options.filter(opt => opt.trim()) : [],
        is_required: q.is_required,
        order_index: q.order_index,
      }))

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)

      if (questionsError) throw questionsError

      // Navigate to forms list
      navigate('/forms')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save form')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/forms')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forms
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create New Form</h1>
              <p className="text-muted-foreground">
                Build a feedback form to collect responses from your customers
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
            <Button
              onClick={saveForm}
              disabled={saving || !formData.title.trim() || formData.questions.length === 0}
              className="flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Form'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
            {error}
          </div>
        )}

        <div className={`grid gap-8 ${showPreview ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
          {/* Form Builder */}
          <div className="space-y-6">
            {/* Form Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Form Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="form-title">Form Title</Label>
                  <Input
                    id="form-title"
                    value={formData.title}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    placeholder="Enter form title..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-description">Description (Optional)</Label>
                  <Textarea
                    id="form-description"
                    value={formData.description}
                    onChange={(e) => updateFormData({ description: e.target.value })}
                    placeholder="Describe what this form is for..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="form-active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => updateFormData({ is_active: checked })}
                  />
                  <Label htmlFor="form-active">
                    Active (form will be available for responses)
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Questions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Questions</CardTitle>
                  <Button onClick={addQuestion} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {formData.questions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-4">No questions added yet.</p>
                    <Button onClick={addQuestion} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Question
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.questions
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((question, index) => (
                        <QuestionEditor
                          key={question.id}
                          question={question}
                          onUpdate={(updatedQuestion) => updateQuestion(question.id, updatedQuestion)}
                          onDelete={() => deleteQuestion(question.id)}
                          onMoveUp={() => moveQuestion(question.id, 'up')}
                          onMoveDown={() => moveQuestion(question.id, 'down')}
                          canMoveUp={index > 0}
                          canMoveDown={index < formData.questions.length - 1}
                        />
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="space-y-6">
              <div className="sticky top-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Preview</h2>
                  <span className="text-sm text-muted-foreground">
                    How your form will look to users
                  </span>
                </div>
                <FormPreview formData={formData} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}