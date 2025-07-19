import React from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Users, BarChart3, Zap, Shield, Globe } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-background transition-colors duration-500">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 animate-fade-in">
        <div className="text-center animate-slide-up">
          <div className="flex justify-center mb-8">
            <div className="bg-primary p-6 rounded-3xl shadow-lg">
              <MessageSquare className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-bold text-foreground mb-6 leading-tight">
            Collect Feedback
            <span className="text-primary"> Effortlessly</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Create beautiful feedback forms, share them with your customers, and gain valuable insights 
            to improve your business. No technical skills required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/signup">Start Collecting Feedback</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Everything you need to collect feedback
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to make feedback collection simple and effective
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 animate-slide-up">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-2">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Quick Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="leading-relaxed">
                Create professional feedback forms in minutes with our intuitive form builder. 
                No coding required.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-2">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Public Access</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="leading-relaxed">
                Share your forms via public URLs. Customers can submit feedback without 
                creating accounts.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-2">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Smart Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="leading-relaxed">
                View responses in beautiful dashboards with summaries and insights to 
                understand your customers better.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-2">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Customer Focused</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="leading-relaxed">
                Designed with your customers in mind. Clean, simple forms that encourage 
                honest feedback.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-2">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Secure & Reliable</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="leading-relaxed">
                Your data is protected with enterprise-grade security. Reliable hosting 
                ensures your forms are always available.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-2">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Real-time Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="leading-relaxed">
                Get notified instantly when new feedback arrives. Stay connected with 
                your customers' thoughts.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-primary-foreground mb-8">
            Ready to start collecting valuable feedback?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-10">
            Join thousands of businesses already using FeedbackFlow to improve their customer experience.
          </p>
          <Button variant="secondary" size="lg" asChild>
            <Link to="/signup">Get Started for Free</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}