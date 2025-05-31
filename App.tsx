import React, { useEffect, useState } from 'react';
import { supabase } from './src/lib/supabase';
import AuthScreen from './src/screens/AuthScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { NavigationContainer } from '@react-navigation/native';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [session]);

  async function fetchProfile() {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    setProfile(data);
    setLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  if (!session || !session.user) {
    return <AuthScreen onAuthSuccess={() => supabase.auth.getSession().then(({ data: { session } }) => setSession(session))} />;
  }

  if (loading || !profile) {
    return null;
  }

  return (
    <NavigationContainer>
      <AppNavigator user={session.user} profile={profile} onSignOut={handleSignOut} />
    </NavigationContainer>
  );
};

export default App;
