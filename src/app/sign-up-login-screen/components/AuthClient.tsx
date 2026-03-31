'use client';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, BedDouble, CheckCircle2, Users, ChefHat } from 'lucide-react';
import { toast } from 'sonner';
import AppLogo from '@/components/ui/AppLogo';
import { useDemoSession } from '@/components/DemoSessionProvider';
import { useDemoWorkspace } from '@/components/DemoWorkspaceProvider';


type AuthMode = 'login' | 'register';
type UserRole = 'Admin' | 'Tenant' | 'Chef';

interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

interface RegisterFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  inviteCode: string;
  agreeTerms: boolean;
}

const DEMO_CREDENTIALS = {
  Admin: { email: 'admin@sunrisedorm.app', password: 'SunriseAdmin2026' },
  Tenant: { email: 'sophea.kang@dormflow.app', password: 'TenantPass2026' },
  Chef: { email: 'chef.kim@sunrisedorm.app', password: 'ChefKitchen2026' },
};

const roleConfig: Record<UserRole, { icon: React.ElementType; description: string; color: string }> = {
  Admin: { icon: Users, description: 'Manage dorms, rooms, invoices, and tenants', color: 'text-[hsl(var(--primary))]' },
  Tenant: { icon: BedDouble, description: 'View your room, invoices, and submit requests', color: 'text-green-600' },
  Chef: { icon: ChefHat, description: 'Access meal plans and kitchen operations', color: 'text-amber-600' },
};

const redirectMap: Record<UserRole, string> = {
  Admin: '/admin-dashboard',
  Tenant: '/tenant-dashboard',
  Chef: '/chef-dashboard',
};

export default function AuthClient() {
  const router = useRouter();
  const { isHydrated, session, signIn } = useDemoSession();
  const { hasModule } = useDemoWorkspace();
  const mealServiceEnabled = hasModule('mealService');
  const [mode, setMode] = useState<AuthMode>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Admin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<LoginFormValues>({ defaultValues: { email: '', password: '', remember: false } });
  const registerForm = useForm<RegisterFormValues>({ defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', role: 'Admin', inviteCode: '', agreeTerms: false } });

  useEffect(() => {
    Object.values(redirectMap).forEach((href) => {
      router.prefetch(href);
    });
  }, [router]);

  useEffect(() => {
    if (!isHydrated || !session) return;
    router.replace(session.homePath);
  }, [isHydrated, router, session]);

  useEffect(() => {
    registerForm.setValue('role', selectedRole);
  }, [registerForm, selectedRole]);

  useEffect(() => {
    if (selectedRole === 'Chef' && !mealServiceEnabled) {
      setSelectedRole('Admin');
    }
  }, [mealServiceEnabled, selectedRole]);

  async function handleLogin(data: LoginFormValues) {
    setLoading(true);
    // BACKEND INTEGRATION: POST /api/auth/login
    await new Promise(r => setTimeout(r, 900));

    const creds = DEMO_CREDENTIALS[selectedRole];
    if (data.email === creds.email && data.password === creds.password) {
      const nextSession = signIn(selectedRole);
      toast.success(`Welcome back! Signed in as ${selectedRole}`);
      await new Promise(r => setTimeout(r, 400));
      router.push(nextSession.homePath);
    } else {
      setLoading(false);
      loginForm.setError('email', {
        message: `Invalid credentials. Try: ${creds.email} / ${creds.password}`,
      });
    }
  }

  async function handleRegister(data: RegisterFormValues) {
    setLoading(true);
    // BACKEND INTEGRATION: POST /api/auth/register
    await new Promise(r => setTimeout(r, 1000));
    const nextSession = signIn(data.role);
    toast.success('Account created! Welcome to DormFlow.');
    await new Promise(r => setTimeout(r, 400));
    router.push(nextSession.homePath);
  }

  const features = [
    'Room & seat occupancy management',
    'Automated rent invoicing',
    'Maintenance request tracking',
    'Role-based dashboards',
    'Meal planning & chef tools',
    'Multi-dorm enterprise controls',
  ];

  const modeHeading =
    mode === 'login' ? 'Sign in to your dorm workspace' : 'Create your DormFlow account';
  const modeDescription =
    mode === 'login'
      ? 'Use the role below to open the right dashboard with the correct demo credentials.'
      : 'Create an account with the same layout and controls used throughout the rest of the app.';
  const inviteCodeHint =
    selectedRole === 'Tenant'
      ? 'Required for Tenant accounts — provided by your dorm admin'
      : 'Required for Chef accounts — provided by your dorm admin';
  const isRegister = mode === 'register';

  return (
    <div className="min-h-screen flex lg:h-screen lg:overflow-hidden">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] bg-[hsl(var(--primary))] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-24 -translate-x-16" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-white/3 rounded-full -translate-x-1/2 -translate-y-1/2" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <AppLogo size={40} theme="light" />
          <span className="text-white text-xl font-semibold">DormFlow</span>
        </div>

        {/* Hero content */}
        <div className="relative space-y-8">
          <div>
            <h1 className="text-4xl font-700 text-white leading-tight">
              Dormitory management<br />
              <span className="text-white/70">built for operators.</span>
            </h1>
            <p className="text-white/70 text-[15px] mt-4 leading-relaxed max-w-md">
              From room assignments to rent collection and maintenance — DormFlow handles your entire residence operation in one platform.
            </p>
          </div>
          <div className="space-y-3">
            {features.map((f) => (
              <div key={`feature-${f}`} className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-white/60 flex-shrink-0" />
                <span className="text-white/80 text-[14px]">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative border-t border-white/20 pt-6">
          <p className="text-white/60 text-[13px] italic">
            "DormFlow cut our invoice chase time by 60%. The occupancy dashboard alone is worth it."
          </p>
          <p className="text-white/50 text-[12px] mt-1">— Property Manager, Riverside Residence</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div
        className={`flex-1 min-h-0 flex flex-col items-center px-6 bg-[hsl(var(--background))] ${
          isRegister ? 'justify-start overflow-y-auto py-6 sm:py-8' : 'justify-center py-10'
        }`}
      >
        <div className="w-full max-w-[440px] space-y-5">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 justify-center mb-2">
            <AppLogo size={36} />
            <span className="text-xl font-semibold text-[hsl(var(--foreground))]">DormFlow</span>
          </div>

          <div
            className={`rounded-[28px] border border-[hsl(var(--border))] bg-white/95 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)] backdrop-blur ${
              isRegister ? 'flex flex-col' : 'flex h-[min(760px,calc(100vh-1.5rem))] flex-col overflow-hidden sm:h-[min(760px,calc(100vh-4rem))]'
            }`}
          >
            <div className={`${isRegister ? '' : 'shrink-0 '}space-y-5 p-5 sm:p-6`}>
              {/* Mode tabs */}
              <div className="bg-[hsl(var(--muted))] rounded-xl p-1 flex">
                {(['login', 'register'] as AuthMode[]).map(m => (
                  <button
                    key={`mode-${m}`}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition-all ${
                      mode === m ? 'bg-white text-[hsl(var(--foreground))] shadow-sm' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                    }`}
                  >
                    {m === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--primary))]">
                  {mode === 'login' ? 'Welcome Back' : 'New Account'}
                </p>
                <h2 className="text-[26px] font-semibold leading-tight text-[hsl(var(--foreground))]">
                  {modeHeading}
                </h2>
                <p className="text-[13px] leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {modeDescription}
                </p>
              </div>

              {/* Role selector */}
              <div className="space-y-2">
                <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                  {mode === 'login' ? 'Continue as' : 'Create account for'}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(roleConfig) as UserRole[]).map(role => {
                    const { icon: RoleIcon, description, color } = roleConfig[role];
                    const isSelected = selectedRole === role;
                    const isDisabled = role === 'Chef' && !mealServiceEnabled;
                    return (
                      <button
                        key={`role-${role}`}
                        onClick={() => {
                          if (isDisabled) return;
                          setSelectedRole(role);
                        }}
                        className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-all ${
                          isDisabled
                            ? 'cursor-not-allowed border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.55)] opacity-55'
                            : isSelected
                              ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.06)]'
                              : 'border-[hsl(var(--border))] bg-white hover:border-[hsl(var(--primary)/0.4)] hover:bg-[hsl(var(--primary)/0.02)]'
                        }`}
                        title={isDisabled ? 'Meal service must be enabled by the dorm owner before chef access is available.' : description}
                        type="button"
                        disabled={isDisabled}
                      >
                        <RoleIcon size={20} className={isDisabled ? 'text-[hsl(var(--muted-foreground))]' : (isSelected ? color : 'text-[hsl(var(--muted-foreground))]')} />
                        <span className={`text-[12px] font-medium ${isDisabled ? 'text-[hsl(var(--muted-foreground))]' : (isSelected ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]')}`}>
                          {role}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {!mealServiceEnabled && (
                  <p className="text-[12px] text-[hsl(var(--muted-foreground))]">
                    Chef access is unavailable until the dorm owner enables meal service.
                  </p>
                )}
              </div>
            </div>

            <div className={`${isRegister ? '' : 'flex-1 '}border-t border-[hsl(var(--border))] p-5 sm:p-6`}>
              {/* Login form */}
              {mode === 'login' && (
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4 slide-up">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Email address</label>
                    <input
                      type="email"
                      {...loginForm.register('email', {
                        required: 'Email is required',
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                      })}
                      placeholder={DEMO_CREDENTIALS[selectedRole].email}
                      className={`w-full px-3 py-2.5 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] focus:border-[hsl(var(--primary))] placeholder:text-[hsl(var(--muted-foreground))] ${loginForm.formState.errors.email ? 'border-red-400 bg-red-50' : 'border-[hsl(var(--border))]'}`}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-[12px] text-red-600">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Password</label>
                      <button
                        type="button"
                        className="text-[12px] text-[hsl(var(--primary))] hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...loginForm.register('password', { required: 'Password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })}
                        placeholder="Enter your password"
                        className={`w-full px-3 py-2.5 pr-10 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] focus:border-[hsl(var(--primary))] placeholder:text-[hsl(var(--muted-foreground))] ${loginForm.formState.errors.password ? 'border-red-400 bg-red-50' : 'border-[hsl(var(--border))]'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-[12px] text-red-600">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="remember"
                      {...loginForm.register('remember')}
                      className="rounded border-[hsl(var(--border))] accent-[hsl(var(--primary))]"
                    />
                    <label htmlFor="remember" className="text-[13px] text-[hsl(var(--muted-foreground))]">
                      Remember me for 30 days
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-[14px] font-medium text-white bg-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary)/0.9)] disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      `Sign in as ${selectedRole}`
                    )}
                  </button>

                  <div className="rounded-xl border border-[hsl(var(--primary)/0.15)] bg-[hsl(var(--primary)/0.04)] p-4 space-y-2">
                    <p className="text-[12px] font-semibold text-[hsl(var(--primary))] uppercase tracking-wider">
                      Demo Credentials — {selectedRole}
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[hsl(var(--muted-foreground))] w-16">Email</span>
                        <span className="text-[12px] font-mono font-medium text-[hsl(var(--foreground))]">
                          {DEMO_CREDENTIALS[selectedRole].email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[hsl(var(--muted-foreground))] w-16">Password</span>
                        <span className="text-[12px] font-mono font-medium text-[hsl(var(--foreground))]">
                          {DEMO_CREDENTIALS[selectedRole].password}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        loginForm.setValue('email', DEMO_CREDENTIALS[selectedRole].email);
                        loginForm.setValue('password', DEMO_CREDENTIALS[selectedRole].password);
                        if (mode !== 'login') setMode('login');
                        toast.info('Demo credentials filled in');
                      }}
                      className="text-[12px] text-[hsl(var(--primary))] font-medium hover:underline"
                    >
                      Fill credentials automatically →
                    </button>
                  </div>

                  <p className="text-center text-[13px] text-[hsl(var(--muted-foreground))]">
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="text-[hsl(var(--primary))] font-medium hover:underline"
                    >
                      Create one
                    </button>
                  </p>
                </form>
              )}

              {/* Register form */}
              {mode === 'register' && (
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4 slide-up">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...registerForm.register('fullName', {
                        required: 'Full name is required',
                        minLength: { value: 2, message: 'Name must be at least 2 characters' },
                      })}
                      placeholder="Your full name"
                      className={`w-full px-3 py-2.5 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] focus:border-[hsl(var(--primary))] placeholder:text-[hsl(var(--muted-foreground))] ${registerForm.formState.errors.fullName ? 'border-red-400 bg-red-50' : 'border-[hsl(var(--border))]'}`}
                    />
                    {registerForm.formState.errors.fullName && (
                      <p className="text-[12px] text-red-600">{registerForm.formState.errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                      Email address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      {...registerForm.register('email', {
                        required: 'Email is required',
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                      })}
                      placeholder="you@example.com"
                      className={`w-full px-3 py-2.5 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] focus:border-[hsl(var(--primary))] placeholder:text-[hsl(var(--muted-foreground))] ${registerForm.formState.errors.email ? 'border-red-400 bg-red-50' : 'border-[hsl(var(--border))]'}`}
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-[12px] text-red-600">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[12px] text-[hsl(var(--muted-foreground))]">Minimum 8 characters</p>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...registerForm.register('password', {
                          required: 'Password is required',
                          minLength: { value: 8, message: 'Minimum 8 characters' },
                        })}
                        placeholder="Create a strong password"
                        className={`w-full px-3 py-2.5 pr-10 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] focus:border-[hsl(var(--primary))] placeholder:text-[hsl(var(--muted-foreground))] ${registerForm.formState.errors.password ? 'border-red-400 bg-red-50' : 'border-[hsl(var(--border))]'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-[12px] text-red-600">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...registerForm.register('confirmPassword', {
                          required: 'Please confirm your password',
                          validate: (val) => {
                            const pw = registerForm.getValues('password');
                            return val === pw || 'Passwords do not match';
                          },
                        })}
                        placeholder="Re-enter your password"
                        className={`w-full px-3 py-2.5 pr-10 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] focus:border-[hsl(var(--primary))] placeholder:text-[hsl(var(--muted-foreground))] ${registerForm.formState.errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-[hsl(var(--border))]'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-[12px] text-red-600">{registerForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  {selectedRole !== 'Admin' && (
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                        Invitation Code
                      </label>
                      <p className="text-[12px] text-[hsl(var(--muted-foreground))]">{inviteCodeHint}</p>
                      <input
                        type="text"
                        {...registerForm.register('inviteCode')}
                        placeholder="e.g. SUNRISE-2026-XXXX"
                        className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] placeholder:text-[hsl(var(--muted-foreground))] font-mono"
                      />
                    </div>
                  )}

                  <div className="flex items-start gap-2 rounded-xl bg-[hsl(var(--muted)/0.55)] p-3">
                    <input
                      type="checkbox"
                      id="agreeTerms"
                      {...registerForm.register('agreeTerms', {
                        required: 'You must agree to the terms to continue',
                      })}
                      className="mt-0.5 rounded border-[hsl(var(--border))] accent-[hsl(var(--primary))]"
                    />
                    <label htmlFor="agreeTerms" className="text-[13px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                      I agree to the{' '}
                      <button type="button" className="text-[hsl(var(--primary))] hover:underline font-medium">Terms of Service</button>
                      {' '}and{' '}
                      <button type="button" className="text-[hsl(var(--primary))] hover:underline font-medium">Privacy Policy</button>
                    </label>
                  </div>
                  {registerForm.formState.errors.agreeTerms && (
                    <p className="text-[12px] text-red-600">{registerForm.formState.errors.agreeTerms.message}</p>
                  )}

                  <p className="text-[12px] text-[hsl(var(--muted-foreground))]">
                    <span className="text-red-500">*</span> Required fields
                  </p>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-[14px] font-medium text-white bg-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary)/0.9)] disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      `Create ${selectedRole} account`
                    )}
                  </button>

                  <p className="text-center text-[13px] text-[hsl(var(--muted-foreground))]">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-[hsl(var(--primary))] font-medium hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
