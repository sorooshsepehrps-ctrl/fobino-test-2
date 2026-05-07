import React from 'react';
import { RefreshCcw } from 'lucide-react';
import Button from '../ui/Button';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('UI crash captured by AppErrorBoundary:', error, info);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16" dir="rtl">
        <div className="mx-auto max-w-xl rounded-[32px] bg-white p-8 text-center shadow-sm ring-1 ring-slate-100">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-600">
            <RefreshCcw size={28} />
          </div>
          <h1 className="mt-5 text-2xl font-black text-slate-950">خطای غیرمنتظره در نمایش صفحه</h1>
          <p className="mt-3 leading-8 text-slate-600">
            صفحه به‌صورت امن متوقف شد تا داده اشتباه باعث بهم ریختن تجربه کاربر نشود. دوباره تلاش کنید.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={this.handleReset} icon={RefreshCcw}>تلاش دوباره</Button>
            <Button variant="outline" onClick={() => window.location.assign('/')}>بازگشت به خانه</Button>
          </div>
        </div>
      </main>
    );
  }
}
