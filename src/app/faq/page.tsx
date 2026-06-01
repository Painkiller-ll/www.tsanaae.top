'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/faqs')
      .then(res => res.json())
      .then(data => setFaqs(data.faqs || []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-purple-400 transition-colors">首页</Link>
          <span>/</span>
          <span className="text-foreground">常见问题</span>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-6">常见问题</h1>

        {faqs.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <div className="text-4xl mb-4">❓</div>
            <h3 className="text-lg font-medium text-foreground mb-2">暂无常见问题</h3>
            <p className="text-muted-foreground">站长尚未添加常见问题</p>
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.map(faq => (
              <div
                key={faq.id}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                  className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-secondary/30 transition-colors"
                >
                  <span className="font-medium text-foreground">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${expandedId === faq.id ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedId === faq.id && (
                  <div className="px-4 pb-4 text-muted-foreground leading-relaxed border-t border-border pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/contact"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            没有找到答案？联系我们 →
          </Link>
        </div>
      </div>
    </div>
  );
}
