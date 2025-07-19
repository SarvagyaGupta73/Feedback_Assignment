import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { FormData } from '../../types/form'

interface FormPreviewProps {
  formData: FormData
}

export const FormPreview: React.FC<FormPreviewProps> = ({ formData }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{formData.title || 'Untitled Form'}</CardTitle>
          {formData.description && (
            <p className="text-muted-foreground">{formData.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {formData.questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No questions added yet. Add questions to see the preview.
            </div>
          ) : (
            formData.questions
              .sort((a, b) => a.order_index - b.order_index)
              .map((question, index) => (
                <div key={question.id} className="space-y-2">
                  <Label className="text-base font-medium">
                    {index + 1}. {question.question_text}
                    {question.is_required && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </Label>

                  {question.question_type === 'text' && (
                    <Textarea
                      placeholder="Your answer..."
                      disabled
                      className="bg-muted"
                    />
                  )}

                  {question.question_type === 'multiple_choice' && (
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            disabled
                            className="h-4 w-4"
                          />
                          <span className="text-sm">{option}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.question_type === 'rating' && (
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          disabled
                          className="h-8 w-8 rounded border border-input bg-muted text-sm"
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
          )}

          {formData.questions.length > 0 && (
            <div className="pt-4 border-t">
              <Button disabled className="w-full">
                Submit Feedback
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}