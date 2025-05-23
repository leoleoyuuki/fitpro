'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DumbbellIcon, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface WorkoutPlan {
  split: string[];
  exercises: {
    [key: string]: {
      name: string;
      sets: number;
      reps: string;
      rir: number;
      notes?: string;
    }[];
  };
}

const generateWorkoutPlan = (daysPerWeek: number): WorkoutPlan => {
  // Scientific principles applied:
  // - 5-10 reps for optimal hypertrophy
  // - Up to 18 sets per muscle group per week
  // - 0-2 RIR (Reps in Reserve) for optimal stimulus
  
  const splits = {
    2: ['Upper Body', 'Lower Body'],
    3: ['Push', 'Pull', 'Legs'],
    4: ['Upper Body', 'Lower Body', 'Upper Body', 'Lower Body'],
    5: ['Push', 'Pull', 'Legs', 'Upper Body', 'Lower Body'],
    6: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs']
  };

  const exercises = {
    'Push': [
      { name: 'Bench Press', sets: 4, reps: '6-8', rir: 1, notes: 'Control the eccentric phase' },
      { name: 'Overhead Press', sets: 3, reps: '8-10', rir: 2 },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '8-10', rir: 1 },
      { name: 'Lateral Raises', sets: 3, reps: '10-12', rir: 1 },
      { name: 'Tricep Pushdowns', sets: 3, reps: '8-10', rir: 1 }
    ],
    'Pull': [
      { name: 'Barbell Rows', sets: 4, reps: '6-8', rir: 1, notes: 'Focus on scapular retraction' },
      { name: 'Pull-ups/Lat Pulldowns', sets: 3, reps: '8-10', rir: 2 },
      { name: 'Face Pulls', sets: 3, reps: '10-12', rir: 1 },
      { name: 'Bicep Curls', sets: 3, reps: '8-10', rir: 1 },
      { name: 'Hammer Curls', sets: 2, reps: '8-10', rir: 1 }
    ],
    'Legs': [
      { name: 'Squats', sets: 4, reps: '6-8', rir: 1, notes: 'Break parallel for full ROM' },
      { name: 'Romanian Deadlifts', sets: 3, reps: '8-10', rir: 2 },
      { name: 'Leg Press', sets: 3, reps: '8-10', rir: 1 },
      { name: 'Leg Extensions', sets: 3, reps: '10-12', rir: 1 },
      { name: 'Standing Calf Raises', sets: 4, reps: '8-10', rir: 1 }
    ],
    'Upper Body': [
      { name: 'Bench Press', sets: 4, reps: '6-8', rir: 1 },
      { name: 'Barbell Rows', sets: 4, reps: '6-8', rir: 1 },
      { name: 'Overhead Press', sets: 3, reps: '8-10', rir: 2 },
      { name: 'Pull-ups/Lat Pulldowns', sets: 3, reps: '8-10', rir: 2 },
      { name: 'Lateral Raises', sets: 3, reps: '10-12', rir: 1 },
      { name: 'Face Pulls', sets: 3, reps: '10-12', rir: 1 }
    ],
    'Lower Body': [
      { name: 'Squats', sets: 4, reps: '6-8', rir: 1 },
      { name: 'Romanian Deadlifts', sets: 3, reps: '8-10', rir: 2 },
      { name: 'Leg Press', sets: 3, reps: '8-10', rir: 1 },
      { name: 'Leg Extensions', sets: 3, reps: '10-12', rir: 1 },
      { name: 'Leg Curls', sets: 3, reps: '10-12', rir: 1 },
      { name: 'Standing Calf Raises', sets: 4, reps: '8-10', rir: 1 }
    ]
  };

  return {
    split: splits[daysPerWeek as keyof typeof splits],
    exercises
  };
};

export default function WorkoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const plan = generateWorkoutPlan(userData.weeklyAvailability);
          setWorkoutPlan(plan);
          setSelectedDay(plan.split[0]);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl">Loading your workout plan...</div>
      </div>
    );
  }

  if (!workoutPlan) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Workout Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Unable to load your workout plan. Please try again later.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Your Workout Plan</h1>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        <Alert>
          <DumbbellIcon className="h-4 w-4" />
          <AlertTitle>Training Guidelines</AlertTitle>
          <AlertDescription>
            • Perform exercises with proper form
            • RIR (Reps in Reserve) indicates how many reps you should have left in the tank
            • Progressive overload: Increase weight when you can complete all sets with good form
          </AlertDescription>
        </Alert>

        <Tabs value={selectedDay} onValueChange={setSelectedDay}>
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 w-full">
            {workoutPlan.split.map((day, index) => (
              <TabsTrigger key={index} value={day}>
                Day {index + 1}: {day}
              </TabsTrigger>
            ))}
          </TabsList>

          {workoutPlan.split.map((day, index) => (
            <TabsContent key={index} value={day}>
              <Card>
                <CardHeader>
                  <CardTitle>{day} Workout</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {workoutPlan.exercises[day].map((exercise, exerciseIndex) => (
                      <div
                        key={exerciseIndex}
                        className="border rounded-lg p-4 hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold">{exercise.name}</h3>
                          <span className="text-sm text-muted-foreground">
                            RIR: {exercise.rir}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{exercise.sets} sets</span>
                          <span>{exercise.reps} reps</span>
                        </div>
                        {exercise.notes && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            Note: {exercise.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
