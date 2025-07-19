export interface Question {
  id: string
  question_text: string
  question_type: 'text' | 'multiple_choice' | 'rating'
  options: string[]
  is_required: boolean
  order_index: number
}

export interface FormData {
  id?: string
  title: string
  description: string
  is_active: boolean
  questions: Question[]
}

export interface FormResponse {
  id: string
  form_id: string
  submitted_at: string
  answers: Answer[]
}

export interface Answer {
  id: string
  question_id: string
  answer_text: string
}