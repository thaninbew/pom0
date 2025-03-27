import './App.css'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card'

function App() {
  return (
    <div className="h-screen w-full flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Pom0</CardTitle>
          <CardDescription>A React + Electron app with shadcn/ui styling</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This is a starter template for your Electron application using:</p>
          <ul className="list-disc list-inside mb-4 space-y-1">
            <li>React for UI</li>
            <li>Electron for desktop application</li>
            <li>shadcn/ui for styling</li>
            <li>TailwindCSS for utility classes</li>
            <li>Vite for fast development</li>
          </ul>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Documentation</Button>
          <Button>Get Started</Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default App
