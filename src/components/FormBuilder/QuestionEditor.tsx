import React from 'react'
import { Trash2, GripVertical, Plus, X } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Switch } from '../ui/switch'
import { Card, CardContent, CardHeader } from '../ui/card'
import { Question } from '../../types/form'

interface QuestionEditorProps {
  question: Question
  onUpdate: (question: Question) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canMoveUp: boolean
  canMoveDown: boolean
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}) => {
  const updateQuestion = (updates: Partial<Question>) => {
    onUpdate({ ...question, ...updates })
  }

  const addOption = () => {
    const newOptions = [...question.options, '']
    updateQuestion({ options: newOptions })
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...question.options]
    newOptions[index] = value
    updateQuestion({ options: newOptions })
  }

  const removeOption = (index: number) => {
    const newOptions = question.options.filter((_, i) => i !== index)
    updateQuestion({ options: newOptions })
  }

  return (
    <Card className="relative">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
            <span className="text-sm font-medium text-muted-foreground">
              Question {question.order_index + 1}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className="h-8 w-8 p-0"
            >
              ↑
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className="h-8 w-8 p-0"
            >
              ↓
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`question-text-${question.id}`}>Question Text</Label>
          <Textarea
            id={`question-text-${question.id}`}
            value={question.question_text}
            onChange={(e) => updateQuestion({ question_text: e.target.value })}
            placeholder="Enter your question..."
            className="min-h-[60px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`question-type-${question.id}`}>Question Type</Label>
            <Select
              value={question.question_type}
              onValueChange={(value: 'text' | 'multiple_choice' | 'rating') =>
                updateQuestion({ question_type: value, options: value === 'text' ? [] : question.options })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text Input</SelectItem>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="rating">Rating (1-5)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <Switch
              id={`required-${question.id}`}
              checked={question.is_required}
              onCheckedChange={(checked) => updateQuestion({ is_required: checked })}
            />
            <Label htmlFor={`required-${question.id}`} className="text-sm">
              Required
            </Label>
          </div>
        </div>

        {question.question_type === 'multiple_choice' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Options</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Option
              </Button>
            </div>
            <div className="space-y-2">
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(index)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {question.question_type === 'rating' && (
          <div className="text-sm text-muted-foreground">
            Rating scale: 1 (Poor) to 5 (Excellent)
          </div>
        )}
      </CardContent>
    </Card>
  )
}