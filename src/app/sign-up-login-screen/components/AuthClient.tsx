'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import {
  Eye,
  EyeOff,
  Loader2,
  BedDouble,
  CheckCircle2,
  Users,
  ChefHat,
  MailPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import AppLogo from '@/components/ui/AppLogo';
import { useDemoSession } from '@/components/DemoSessionProvider';

type AuthMode = 'login' | 'register' | 'invite';

interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

interface RegisterFormValues {
  fullName: string;
  email: string;
  dormName: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

interface InviteFormValues {
  fullName: string;
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

const DEMO_ACCOUNTS = [
  {
    id: 'owner',
    label: 'Dorm Owner',
    icon: Users,
    color: 'text-[hsl(var(--primary))]',
    email: 'admin@sunrisedorm.app',
    password: 'SunriseAdmin2026',
    description: 'Multi-dorm owner account with access across the portfolio.',
  },
  {
    id: 'tenant',
    label: 'Tenant',
    icon: BedDouble,
    color: 'text-green-600',
    email: 'sophea.kang@dormflow.app',
    password: 'TenantPass2026',
    description: 'Accepted tenant invitation linked to Room 101.',
  },
  {
    id: 'chef',
    label: 'Chef',
    icon: ChefHat,
    color: 'text-amber-600',
    email: 'chef.kim@sunrisedorm.app',
    password: 'ChefKitchen2026',
    description: 'Accepted chef invitation linked to the Sunrise kitchen.',
  },
];

const redirectMap = [
  '/admin-dashboard',
  '/tenant-dashboard',
  '/chef-dashboard',
] as const;

export default function AuthClient() {
  const router = useRouter();
  const {
    acceptInvitation,
    isHydrated,
    session,
    signIn,
    signUpOwner,
  } = useDemoSession();
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '', remember: false },
  });
  const registerForm = useForm<RegisterFormValues>({
    defaultValues: {
      fullName: '',
      email: '',
      dormName: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    },
  });
  const inviteForm = useForm<InviteFormValues>({
    defaultValues: {
      fullName: '',
      email: '',
      code: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    },
  });

  useEffect(() => {
    redirectMap.forEach((href) => {
      router.prefetch(href);
    });
  }, [router]);

  useEffect(() => {
    if (!isHydrated || !session) return;
    router.replace(session.homePath);
  }, [isHydrated, router, session]);

  async function handleLogin(data: LoginFormValues) {
    setLoading(true);

    try {
      const nextSession = await signIn({
        email: data.email,
        password: data.password,
      });
      toast.success(`Welcome back, ${nextSession.name.split(' ')[0]}`);
      router.push(nextSession.homePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in.';
      loginForm.setError('email', { message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(data: RegisterFormValues) {
    setLoading(true);

    try {
      const nextSession = await signUpOwner({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        dormName: data.dormName,
      });
      toast.success('Owner account created. Your demo workspace is ready.');
      router.push(nextSession.homePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create the account.';
      registerForm.setError('email', { message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptInvite(data: InviteFormValues) {
    setLoading(true);

    try {
      const nextSession = await acceptInvitation({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        code: data.code,
      });
      toast.success('Invitation accepted. Your workspace is ready.');
      router.push(nextSession.homePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to accept the invitation.';
      inviteForm.setError('code', { message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function fillDemoCredentials(email: string, password: string) {
    loginForm.setValue('email', email);
    loginForm.setValue('password', password);
    if (mode !== 'login') setMode('login');
    toast.info('Demo credentials filled in');
  }

  const features = [
    'Room & seat occupancy management',
    'Automated rent invoicing',
    'Maintenance request tracking',
    'Role-based dashboards',
    'Invite-only tenant and chef onboarding',
    'Multi-dorm enterprise controls',
  ];

  const modeHeading =
    mode === 'login'
      ? 'Sign in to your dorm workspace'
      : mode === 'register'
        ? 'Create your owner account'
        : 'Accept your dorm invitation';
  const modeDescription =
    mode === 'login'
      ? 'Use your email and password. Access is determined by your memberships, not by choosing a role.'
      : mode === 'register'
        ? 'Public signup is limited to dorm owners. Tenant and chef access must come through invitations.'
        : 'Tenant and chef accounts are invite-only. Use the email and code sent by your dorm owner.';
  return (
    <div className="min-h-screen flex lg:h-[100dvh] lg:overflow-hidden">
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] bg-[hsl(var(--primary))] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-24 -translate-x-16" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-white/3 rounded-full -translate-x-1/2 -translate-y-1/2" />

        <div className="relative flex items-center gap-3">
          <AppLogo size={40} theme="light" />
          <span className="text-white text-xl font-semibold">DormFlow</span>
        </div>

        <div className="relative space-y-8">
          <div>
            <h1 className="text-4xl font-700 text-white leading-tight">
              Dormitory management<br />
              <span className="text-white/70">built for operators.</span>
            </h1>
            <p className="text-white/70 text-[15px] mt-4 leading-relaxed max-w-md">
              Identity-based access is now separated from the demo workspace so you can keep building the frontend while preparing for a real backend later.
            </p>
          </div>
          <div className="space-y-3">
            {features.map((feature) => (
              <div key={`feature-${feature}`} className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-white/60 flex-shrink-0" />
                <span className="text-white/80 text-[14px]">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative border-t border-white/20 pt-6">
          <p className="text-white/60 text-[13px] italic">
            "DormFlow cut our invoice chase time by 60%. The occupancy dashboard alone is worth it."
          </p>
          <p className="text-white/50 text-[12px] mt-1">— Property Manager, Riverside Residence</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto bg-[hsl(var(--background))] px-6 py-6 sm:py-8 lg:py-10">
        <div className="mx-auto flex min-h-full w-full max-w-[440px] flex-col">
          <div className="lg:hidden flex items-center gap-2 justify-center mb-2">
            <AppLogo size={36} />
            <span className="text-xl font-semibold text-[hsl(var(--foreground))]">DormFlow</span>
          </div>

          <div className="my-auto rounded-[28px] border border-[hsl(var(--border))] bg-white/95 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)] backdrop-blur overflow-hidden">
            <div className="space-y-5 p-5 sm:p-6">
              <div className="bg-[hsl(var(--muted))] rounded-xl p-1 grid grid-cols-3 gap-1">
                {([
                  { id: 'login' as const, label: 'Sign In' },
                  { id: 'register' as const, label: 'Owner Signup' },
                  { id: 'invite' as const, label: 'Accept Invite' },
                ]).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setMode(item.id)}
                    className={`py-2 rounded-lg text-[13px] font-medium transition-all ${
                      mode === item.id
                        ? 'bg-white text-[hsl(var(--foreground))] shadow-sm'
                        : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--primary))]">
                  {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Owner Access' : 'Invite-Only Access'}
                </p>
                <h2 className="text-[26px] font-semibold leading-tight text-[hsl(var(--foreground))]">
                  {modeHeading}
                </h2>
                <p className="text-[13px] leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {modeDescription}
                </p>
              </div>
            </div>

            <div className="border-t border-[hsl(var(--border))] p-5 sm:p-6">
              {mode === 'login' && (
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4 slide-up">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Email address</label>
                    <input
                      type="email"
                      {...loginForm.register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Enter a valid email',
                        },
                      })}
                      placeholder="you@example.com"
                      className={`w-full px-3 py-2.5 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] focus:border-[hsl(var(--primary))] placeholder:text-[hsl(var(--muted-foreground))] ${
                        loginForm.formState.errors.email ? 'border-red-400 bg-red-50' : 'border-[hsl(var(--border))]'
                      }`}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-[12px] text-red-600">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Password</label>
                      <button type="button" className="text-[12px] text-[hsl(var(--primary))] hover:underline">
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...loginForm.register('password', {
                          required: 'Password is required',
                          minLength: { value: 6, message: 'Minimum 6 characters' },
                        })}
                        placeholder="Enter your password"
                        className={`w-full px-3 py-2.5 pr-10 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] focus:border-[hsl(var(--primary))] placeholder:text-[hsl(var(--muted-foreground))] ${
                          loginForm.formState.errors.password ? 'border-red-400 bg-red-50' : 'border-[hsl(var(--border))]'
                        }`}
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
                      'Sign In'
                    )}
                  </button>

                  <div className="rounded-xl border border-[hsl(var(--primary)/0.15)] bg-[hsl(var(--primary)/0.04)] p-4 space-y-3">
                    <p className="text-[12px] font-semibold text-[hsl(var(--primary))] uppercase tracking-wider">
                      Demo Accounts
                    </p>
                    <div className="space-y-2">
                      {DEMO_ACCOUNTS.map((account) => {
                        const Icon = account.icon;
                        return (
                          <button
                            key={account.id}
                            type="button"
                            onClick={() => fillDemoCredentials(account.email, account.password)}
                            className="w-full rounded-xl border border-[hsl(var(--border))] bg-white px-3 py-3 text-left transition-colors hover:border-[hsl(var(--primary)/0.35)] hover:bg-[hsl(var(--primary)/0.02)]"
                          >
                            <div className="flex items-start gap-3">
                              <div className="rounded-lg bg-[hsl(var(--muted))] p-2">
                                <Icon size={16} className={account.color} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-[hsl(var(--foreground))]">{account.label}</p>
                                <p className="mt-0.5 text-[12px] text-[hsl(var(--muted-foreground))]">{account.description}</p>
                                <p className="mt-1 text-[12px] font-mono text-[hsl(var(--foreground))]">{account.email}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-center text-[13px] text-[hsl(var(--muted-foreground))]">
                    Need a new dorm owner account?{' '}
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

              {mode === 'register' && (
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4 slide-up">
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-white p-2">
                        <Users size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-blue-900">Owner signup only</p>
                        <p className="mt-1 text-[12px] text-blue-800">
                          Tenant and chef accounts must be created through invitations from inside the dorm workspace.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Full Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      {...registerForm.register('fullName', {
                        required: 'Full name is required',
                        minLength: { value: 2, message: 'Name must be at least 2 characters' },
                      })}
                      placeholder="Your full name"
                      className={`w-full px-3 py-2.5 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] focus:border-[hsl(var(--primary))] placeholder:text-[hsl(var(--muted-foreground))] ${
                        registerForm.formState.errors.fullName ? 'border-red-400 bg-red-50' : 'border-[hsl(var(--border))]'
                      }`}
                    />
                    {registerForm.formState.errors.fullName && (
                      <p className="text-[12px] text-red-600">{registerForm.formState.errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Email address <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      {...registerForm.register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Enter a valid email',
                        },
                      })}
                      placeholder="you@example.com"
                      className={`w-full px-3 py-2.5 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] focus:border-[hsl(var(--primary))] placeholder:text-[hsl(var(--muted-foreground))] ${
                        registerForm.formState.errors.email ? 'border-red-400 bg-red-50' : 'border-[hsl(var(--border))]'
                      }`}
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-[12px] text-red-600">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Dorm Name</label>
                    <input
                      type="text"
                      {...registerForm.register('dormName')}
                      placeholder="Optional in demo mode"
                      className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] focus:border-[hsl(var(--primary))] placeholder:text-[hsl(var(--muted-foreground))]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Password <span className="text-red-500">*</span></label>
                    <p className="text-[12px] text-[hsl(var(--muted-foreground))]">Minimum 8 characters</p>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...registerForm.register('password', {
                          required: 'Password is required',
                          minLength: { value: 8, message: 'Minimum 8 characters' },
                        })}
                        placeholder="Create a strong password"
                        className={`w-full px-3 py-2.5 pr-10 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] focus:border-[hsl(var(--primary))] placeholder:text-[hsl(var(--muted-foreground))] ${
                          registerForm.formState.errors.password ? 'border-red-400 bg-red-50' : 'border-[hsl(var(--border))]'
                        }`}
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
                    <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Confirm Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...registerForm.register('confirmPassword', {
                          required: 'Please confirm your password',
                          validate: (value) => value === registerForm.getValues('password') || 'Passwords do not match',
                        })}
                        placeholder="Re-enter your password"
                        className={`w-full px-3 py-2.5 pr-10 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] focus:border-[hsl(var(--primary))] placeholder:text-[hsl(var(--muted-foreground))] ${
                          registerForm.formState.errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-[hsl(var(--border))]'
                        }`}
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

                  <div className="flex items-start gap-2 rounded-xl bg-[hsl(var(--muted)/0.55)] p-3">
                    <input
                      type="checkbox"
                      id="ownerTerms"
                      {...registerForm.register('agreeTerms', {
                        required: 'You must agree to the terms to continue',
                      })}
                      className="mt-0.5 rounded border-[hsl(var(--border))] accent-[hsl(var(--primary))]"
                    />
                    <label htmlFor="ownerTerms" className="text-[13px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                      I agree to the{' '}
                      <button type="button" className="text-[hsl(var(--primary))] hover:underline font-medium">Terms of Service</button>
                      {' '}and{' '}
                      <button type="button" className="text-[hsl(var(--primary))] hover:underline font-medium">Privacy Policy</button>
                    </label>
                  </div>
                  {registerForm.formState.errors.agreeTerms && (
                    <p className="text-[12px] text-red-600">{registerForm.formState.errors.agreeTerms.message}</p>
                  )}

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
                      'Create Owner Account'
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

              {mode === 'invite' && (
                <form onSubmit={inviteForm.handleSubmit(handleAcceptInvite)} className="space-y-4 slide-up">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-white p-2">
                        <MailPlus size={16} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-amber-900">Invite-only onboarding</p>
                        <p className="mt-1 text-[12px] text-amber-800">
                          Use this flow for tenant or chef access after the dorm owner creates a local demo invitation.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Full Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      {...inviteForm.register('fullName', {
                        required: 'Full name is required',
                        minLength: { value: 2, message: 'Name must be at least 2 characters' },
                      })}
                      placeholder="Your full name"
                      className={`w-full px-3 py-2.5 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] focus:border-[hsl(var(--primary))] placeholder:text-[hsl(var(--muted-foreground))] ${
                        inviteForm.formState.errors.fullName ? 'border-red-400 bg-red-50' : 'border-[hsl(var(--border))]'
                      }`}
                    />
                    {inviteForm.formState.errors.fullName && (
                      <p className="text-[12px] text-red-600">{inviteForm.formState.errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Email address <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      {...inviteForm.register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Enter a valid email',
                        },
                      })}
                      placeholder="you@example.com"
                      className={`w-full px-3 py-2.5 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] focus:border-[hsl(var(--primary))] placeholder:text-[hsl(var(--muted-foreground))] ${
                        inviteForm.formState.errors.email ? 'border-red-400 bg-red-50' : 'border-[hsl(var(--border))]'
                      }`}
                    />
                    {inviteForm.formState.errors.email && (
                      <p className="text-[12px] text-red-600">{inviteForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Invitation Code <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      {...inviteForm.register('code', {
                        required: 'Invitation code is required',
                      })}
                      placeholder="e.g. SUNRISE-AB12"
                      className={`w-full px-3 py-2.5 text-[13px] border rounded-lg bg-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] focus:border-[hsl(var(--primary))] placeholder:text-[hsl(var(--muted-foreground))] ${
                        inviteForm.formState.errors.code ? 'border-red-400 bg-red-50' : 'border-[hsl(var(--border))]'
                      }`}
                    />
                    {inviteForm.formState.errors.code && (
                      <p className="text-[12px] text-red-600">{inviteForm.formState.errors.code.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...inviteForm.register('password', {
                          required: 'Password is required',
                          minLength: { value: 8, message: 'Minimum 8 characters' },
                        })}
                        placeholder="Create your password"
                        className={`w-full px-3 py-2.5 pr-10 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] focus:border-[hsl(var(--primary))] placeholder:text-[hsl(var(--muted-foreground))] ${
                          inviteForm.formState.errors.password ? 'border-red-400 bg-red-50' : 'border-[hsl(var(--border))]'
                        }`}
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
                    {inviteForm.formState.errors.password && (
                      <p className="text-[12px] text-red-600">{inviteForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Confirm Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...inviteForm.register('confirmPassword', {
                          required: 'Please confirm your password',
                          validate: (value) => value === inviteForm.getValues('password') || 'Passwords do not match',
                        })}
                        placeholder="Re-enter your password"
                        className={`w-full px-3 py-2.5 pr-10 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] focus:border-[hsl(var(--primary))] placeholder:text-[hsl(var(--muted-foreground))] ${
                          inviteForm.formState.errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-[hsl(var(--border))]'
                        }`}
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
                    {inviteForm.formState.errors.confirmPassword && (
                      <p className="text-[12px] text-red-600">{inviteForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <div className="flex items-start gap-2 rounded-xl bg-[hsl(var(--muted)/0.55)] p-3">
                    <input
                      type="checkbox"
                      id="inviteTerms"
                      {...inviteForm.register('agreeTerms', {
                        required: 'You must agree to the terms to continue',
                      })}
                      className="mt-0.5 rounded border-[hsl(var(--border))] accent-[hsl(var(--primary))]"
                    />
                    <label htmlFor="inviteTerms" className="text-[13px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                      I agree to the{' '}
                      <button type="button" className="text-[hsl(var(--primary))] hover:underline font-medium">Terms of Service</button>
                      {' '}and{' '}
                      <button type="button" className="text-[hsl(var(--primary))] hover:underline font-medium">Privacy Policy</button>
                    </label>
                  </div>
                  {inviteForm.formState.errors.agreeTerms && (
                    <p className="text-[12px] text-red-600">{inviteForm.formState.errors.agreeTerms.message}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-[14px] font-medium text-white bg-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary)/0.9)] disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Accepting invite...
                      </>
                    ) : (
                      'Accept Invitation'
                    )}
                  </button>

                  <p className="text-center text-[13px] text-[hsl(var(--muted-foreground))]">
                    Already activated?{' '}
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
