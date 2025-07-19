import React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FileText, MessageSquare, TrendingUp, BarChart3 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

export const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalForms: 0,
    totalResponses: 0,
    thisMonth: 0,
    avgResponsesPerForm: 0,
    activeFormsCount: 0,
    topPerformingForm: null as { title: string; responses: number } | null
  })
  const [recentForms, setRecentForms] = useState<{
    id: string;
    title: string;
    responses: number;
    created: string;
  }[]>([])
  const [responsesTrend, setResponsesTrend] = useState<{ date: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)

      // Load forms with response counts
      const { data: formsData, error: formsError } = await supabase
        .from('forms')
        .select(`
          *,
          responses(count)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3)

      if (formsError) throw formsError

      // Transform forms data
      const transformedForms = formsData?.map(form => ({
        id: form.id,
        title: form.title,
        responses: form.responses?.[0]?.count || 0,
        created: getRelativeTime(form.created_at)
      })) || []

      setRecentForms(transformedForms)

      // Calculate total stats
      const { data: allFormsData, error: allFormsError } = await supabase
        .from('forms')
        .select(`
          id,
          title,
          created_at,
          is_active,
          responses(count)
        `)
        .eq('user_id', user?.id)

      if (allFormsError) throw allFormsError

      const totalForms = allFormsData?.length || 0
      const totalResponses = allFormsData?.reduce((sum, form) => 
        sum + (form.responses?.[0]?.count || 0), 0
      ) || 0
      
      // Calculate additional analytics
      const activeFormsCount = allFormsData?.filter(form => form.is_active).length || 0
      const avgResponsesPerForm = totalForms > 0 ? Math.round((totalResponses / totalForms) * 10) / 10 : 0
      
      // Find top performing form
      const topPerformingForm = allFormsData?.reduce((top, form) => {
        const responseCount = form.responses?.[0]?.count || 0
        if (!top || responseCount > top.responses) {
          return { title: form.title, responses: responseCount }
        }
        return top
      }, null as { title: string; responses: number } | null)

      // Calculate this month's responses
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

      const { data: monthlyResponses, error: monthlyError } = await supabase
        .from('responses')
        .select('id, submitted_at, forms!inner(user_id)')
        .eq('forms.user_id', user?.id)
        .gte('submitted_at', oneMonthAgo.toISOString())
        .order('submitted_at')

      if (monthlyError) throw monthlyError

      const thisMonth = monthlyResponses?.length || 0
      
      // Calculate responses trend for the last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        return date.toISOString().split('T')[0]
      })
      
      const trendData = last7Days.map(date => {
        const count = monthlyResponses?.filter(response => 
          response.submitted_at.startsWith(date)
        ).length || 0
        return { date, count }
      })
      
      setResponsesTrend(trendData)

      setStats({
        totalForms,
        totalResponses,
        thisMonth,
        avgResponsesPerForm,
        activeFormsCount,
        topPerformingForm
      })

    } catch (err) {
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user, loadDashboardData])

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) {
      return diffInHours === 0 ? 'Just now' : `${diffInHours} hours ago`
    } else if (diffInHours < 168) { // 7 days
      const days = Math.floor(diffInHours / 24)
      return `${days} day${days > 1 ? 's' : ''} ago`
    } else {
      const weeks = Math.floor(diffInHours / 168)
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`
    }
  }

  const statsData = [
    { label: 'Total Forms', value: stats.totalForms.toString(), icon: FileText, color: 'bg-blue-500' },
    { label: 'Total Responses', value: stats.totalResponses.toString(), icon: MessageSquare, color: 'bg-green-500' },
    { label: 'This Month', value: stats.thisMonth.toString(), icon: TrendingUp, color: 'bg-purple-500' },
    { label: 'Active Forms', value: stats.activeFormsCount.toString(), icon: BarChart3, color: 'bg-orange-500' }
  ]

  return (
    <div className="min-h-screen bg-background transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome back, {user?.email?.split('@')[0]}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your feedback forms today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slide-up">
          {statsData.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1 animate-slide-up">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start h-auto p-4" asChild>
                  <Link to="/forms/new">
                  <div className="bg-primary p-3 rounded-lg mr-3">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">Create New Form</p>
                    <p className="text-sm text-muted-foreground">Build a feedback form</p>
                  </div>
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full justify-start h-auto p-4" asChild>
                  <Link to="/forms">
                  <div className="bg-green-600 p-3 rounded-lg mr-3">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">Manage Forms</p>
                    <p className="text-sm text-muted-foreground">View all your forms</p>
                  </div>
                  </Link>
                </Button>

                <Button variant="outline" className="w-full justify-start h-auto p-4" asChild>
                  <Link to="/responses">
                  <div className="bg-purple-600 p-3 rounded-lg mr-3">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">View Analytics</p>
                    <p className="text-sm text-muted-foreground">Analyze responses</p>
                  </div>
                  </Link>
                </Button>
              </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Forms */}
          <div className="lg:col-span-2 animate-slide-up">
            <Card>
              <CardHeader>
              <div className="flex items-center justify-between mb-6">
                <CardTitle>Recent Forms</CardTitle>
                <Link
                  to="/forms"
                  className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                >
                  View all
                </Link>
              </div>
              </CardHeader>
              <CardContent>

              {recentForms.length > 0 ? (
                <div className="space-y-4">
                  {recentForms.map((form) => (
                    <Card
                      key={form.id}
                      className="hover:shadow-md transition-shadow duration-300"
                    >
                      <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="ml-3">
                          <h3 className="font-semibold text-foreground">{form.title}</h3>
                          <p className="text-sm text-muted-foreground">Created {form.created}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground text-lg">{form.responses}</p>
                        <p className="text-sm text-muted-foreground">responses</p>
                      </div>
                      </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  {loading ? (
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  ) : (
                    <>
                  <div className="bg-muted rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No forms yet</h3>
                  <p className="text-muted-foreground mb-8">
                    Create your first feedback form to start collecting responses.
                  </p>
                  <Button asChild>
                    <Link to="/forms/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Form
                    </Link>
                  </Button>
                    </>
                  )}
                </div>
              )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Analytics Insights */}
        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          {/* Performance Insights */}
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Responses per Form</p>
                  <p className="text-2xl font-bold text-foreground">{stats.avgResponsesPerForm}</p>
                </div>
                <div className="bg-blue-500 p-3 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
              
              {stats.topPerformingForm && (
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Top Performing Form</p>
                    <p className="font-semibold text-foreground truncate max-w-[200px]">
                      {stats.topPerformingForm.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stats.topPerformingForm.responses} responses
                    </p>
                  </div>
                  <div className="bg-green-500 p-3 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Response Trend */}
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle>7-Day Response Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {responsesTrend.map((day, index) => {
                  const maxCount = Math.max(...responsesTrend.map(d => d.count), 1)
                  const percentage = (day.count / maxCount) * 100
                  const date = new Date(day.date)
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
                  
                  return (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-12 text-sm text-muted-foreground">{dayName}</div>
                      <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                        <div 
                          className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-8 text-sm font-medium text-foreground">{day.count}</div>
                    </div>
                  )
                })}
              </div>
              
              {responsesTrend.every(day => day.count === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No responses in the last 7 days</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}