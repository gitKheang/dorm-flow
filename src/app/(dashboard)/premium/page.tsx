"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  CreditCard,
  Crown,
  Lock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import PlanBadge from "@/components/premium/PlanBadge";
import { useDemoSession } from "@/components/DemoSessionProvider";
import { useDemoWorkspace } from "@/components/DemoWorkspaceProvider";
import {
  PREMIUM_PLAN_CHARACTERISTICS,
  PREMIUM_PLAN_DOWNGRADE_OUTCOMES,
  PREMIUM_PLAN_FEATURES,
  PREMIUM_PLAN_MONTHLY_PRICE_USD,
  getPremiumCheckoutContext,
} from "@/lib/plans";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function resolveReturnTo(value: string | null): string {
  return value && value.startsWith("/") ? value : "/settings?tab=dorm";
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function getCheckoutError(input: {
  cardholderName: string;
  billingEmail: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
}) {
  if (!input.cardholderName.trim()) {
    return "Cardholder name is required.";
  }

  if (!/^\S+@\S+\.\S+$/.test(input.billingEmail.trim())) {
    return "Enter a valid billing email.";
  }

  const cardNumberLength = input.cardNumber.replace(/\D/g, "").length;
  if (cardNumberLength < 15 || cardNumberLength > 19) {
    return "Enter a valid card number.";
  }

  const expiryMatch = input.expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!expiryMatch) {
    return "Enter the expiry date as MM/YY.";
  }

  const month = Number(expiryMatch[1]);
  if (month < 1 || month > 12) {
    return "Enter a valid expiry month.";
  }

  if (!/^\d{3,4}$/.test(input.cvc)) {
    return "Enter a valid CVC.";
  }

  return null;
}

export default function PremiumPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useDemoSession();
  const { currentDorm, currentDormPlan, upgradeDormToPremium } =
    useDemoWorkspace();
  const [cardholderName, setCardholderName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const source = searchParams.get("source");
  const sourceContext = useMemo(
    () => getPremiumCheckoutContext(source),
    [source],
  );
  const returnTo = useMemo(
    () => resolveReturnTo(searchParams.get("returnTo")),
    [searchParams],
  );
  const isPremiumActive = currentDormPlan === "premium";

  useEffect(() => {
    if (!cardholderName.trim() && session?.name) {
      setCardholderName(session.name);
    }

    if (!billingEmail.trim() && session?.email) {
      setBillingEmail(session.email);
    }
  }, [billingEmail, cardholderName, session?.email, session?.name]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!currentDorm) {
      toast.error("No active dorm is selected.");
      return;
    }

    if (isPremiumActive) {
      router.push(returnTo);
      return;
    }

    const errorMessage = getCheckoutError({
      cardholderName,
      billingEmail,
      cardNumber,
      expiry,
      cvc,
    });

    if (errorMessage) {
      toast.error(errorMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      upgradeDormToPremium(currentDorm.id);
      toast.success(`Premium activated for ${currentDorm.name}.`);
      router.push(returnTo);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to complete the payment.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!currentDorm) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
            Premium Checkout
          </h1>
          <p className="mt-1 text-[14px] text-[hsl(var(--muted-foreground))]">
            An active dorm is required before Premium can be activated.
          </p>
        </div>
        <Link
          href="/admin-dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-white px-4 py-2.5 text-[13px] font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
        >
          <ArrowLeft size={14} />
          Return to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
              Premium Checkout
            </h1>
            <PlanBadge plan="premium" />
          </div>
          <p className="mt-1 text-[14px] text-[hsl(var(--muted-foreground))]">
            {sourceContext.title} for {currentDorm.name}.
          </p>
        </div>
        <Link
          href={returnTo}
          className="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-white px-4 py-2.5 text-[13px] font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
        >
          <ArrowLeft size={14} />
          Back
        </Link>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-[linear-gradient(135deg,rgba(251,191,36,0.16),rgba(255,255,255,0.96))] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800">
              <Crown size={12} />
              Premium per dorm
            </div>
            <h2 className="mt-4 text-[24px] font-semibold text-amber-950">
              {currency.format(PREMIUM_PLAN_MONTHLY_PRICE_USD)}/month
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-amber-900/85">
              {sourceContext.description}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {PREMIUM_PLAN_CHARACTERISTICS.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-white/80 bg-white/90 p-4 text-[13px] leading-6 text-slate-700 shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-[hsl(var(--border))] bg-white p-6">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-600" />
              <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))]">
                Included in Premium
              </h2>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {PREMIUM_PLAN_FEATURES.map((feature) => {
                const isHighlighted =
                  sourceContext.highlightedFeature === feature.id;

                return (
                  <div
                    key={feature.id}
                    className={`rounded-xl border p-4 transition-colors ${
                      isHighlighted
                        ? "border-amber-300 bg-amber-50"
                        : "border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.18)]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        size={15}
                        className={
                          isHighlighted ? "text-amber-700" : "text-emerald-600"
                        }
                      />
                      <p className="text-[14px] font-medium text-[hsl(var(--foreground))]">
                        {feature.title}
                      </p>
                    </div>
                    <p className="mt-2 text-[13px] leading-6 text-[hsl(var(--muted-foreground))]">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-[hsl(var(--border))] bg-white p-6">
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-amber-700" />
              <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))]">
                If Premium is not continued later
              </h2>
            </div>
            <div className="mt-5 space-y-3">
              {PREMIUM_PLAN_DOWNGRADE_OUTCOMES.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-[13px] leading-6 text-amber-900"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-[hsl(var(--border))] bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))]">
                  Order summary
                </h2>
                <p className="mt-1 text-[13px] text-[hsl(var(--muted-foreground))]">
                  Activates Premium for the active dorm only.
                </p>
              </div>
              <PlanBadge plan={currentDormPlan} />
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.2)] p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-[hsl(var(--primary)/0.12)] p-2 text-[hsl(var(--primary))]">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                      {currentDorm.name}
                    </p>
                    <p className="mt-1 text-[12px] text-[hsl(var(--muted-foreground))]">
                      {currentDorm.city} • billed monthly per dorm
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[hsl(var(--border))] p-4">
                <div className="flex items-center justify-between text-[13px] text-[hsl(var(--muted-foreground))]">
                  <span>Premium monthly plan</span>
                  <span className="font-medium text-[hsl(var(--foreground))]">
                    {currency.format(PREMIUM_PLAN_MONTHLY_PRICE_USD)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-[hsl(var(--border))] pt-3 text-[14px] font-semibold text-[hsl(var(--foreground))]">
                  <span>Total due today</span>
                  <span>{currency.format(PREMIUM_PLAN_MONTHLY_PRICE_USD)}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[hsl(var(--border))] bg-white p-6">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-[hsl(var(--primary))]" />
              <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))]">
                Payment details
              </h2>
            </div>
            <p className="mt-2 rounded-xl border border-blue-200 bg-blue-50 p-4 text-[12px] leading-6 text-blue-900">
              Demo checkout only. No real charge is made. Completing this form
              activates Premium in the current mock workspace.
            </p>

            {isPremiumActive ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <BadgeCheck size={18} className="mt-0.5 text-emerald-700" />
                    <div>
                      <p className="text-[13px] font-semibold text-emerald-900">
                        Premium is already active for this dorm.
                      </p>
                      <p className="mt-1 text-[12px] leading-6 text-emerald-800">
                        No additional checkout is required right now. You can
                        return to the previous screen and continue working.
                      </p>
                    </div>
                  </div>
                </div>
                <Link
                  href={returnTo}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[hsl(var(--primary)/0.9)]"
                >
                  Return to workspace
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                    Cardholder name
                  </label>
                  <input
                    type="text"
                    value={cardholderName}
                    onChange={(event) => setCardholderName(event.target.value)}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                    placeholder="Dorm owner name"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                    Billing email
                  </label>
                  <input
                    type="email"
                    value={billingEmail}
                    onChange={(event) => setBillingEmail(event.target.value)}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                    placeholder="owner@dormflow.app"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                    Card number
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={(event) =>
                      setCardNumber(formatCardNumber(event.target.value))
                    }
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                    placeholder="4242 4242 4242 4242"
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                      Expiry
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={expiry}
                      onChange={(event) =>
                        setExpiry(formatExpiry(event.target.value))
                      }
                      className="w-full rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                      placeholder="MM/YY"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                      CVC
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cvc}
                      onChange={(event) =>
                        setCvc(
                          event.target.value.replace(/\D/g, "").slice(0, 4),
                        )
                      }
                      className="w-full rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                      placeholder="123"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-[13px] font-medium text-white transition-colors ${
                    isSubmitting
                      ? "cursor-not-allowed bg-[hsl(var(--primary)/0.6)]"
                      : "bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)]"
                  }`}
                >
                  {isSubmitting
                    ? "Processing payment..."
                    : `Complete mock payment · ${currency.format(PREMIUM_PLAN_MONTHLY_PRICE_USD)}`}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
