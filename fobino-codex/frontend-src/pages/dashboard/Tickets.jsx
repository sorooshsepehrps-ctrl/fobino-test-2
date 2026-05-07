import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MessageSquare, Clock, Check, AlertCircle } from 'lucide-react';
import { Button, Card } from '../../components/ui';
import { toPersianDate, toPersianNumber } from '../../utils/helpers';
import { ticketService } from '../../services';

const statusConfig = {
  open: { label: 'باز', color: 'bg-blue-100 text-blue-700', icon: MessageSquare },
  in_progress: { label: 'در حال بررسی', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  waiting_user: { label: 'منتظر پاسخ شما', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
  resolved: { label: 'حل شده', color: 'bg-green-100 text-green-700', icon: Check },
  closed: { label: 'بسته شده', color: 'bg-gray-100 text-gray-700', icon: Check },
};

const priorityConfig = {
  low: { label: 'کم', color: 'text-gray-500' },
  medium: { label: 'متوسط', color: 'text-blue-500' },
  high: { label: 'زیاد', color: 'text-orange-500' },
  urgent: { label: 'فوری', color: 'text-red-500' },
};

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await ticketService.getTickets(params);
      setTickets(response.data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">تیکت‌های پشتیبانی</h1>
        <Link to="/dashboard/tickets/new">
          <Button icon={Plus}>ایجاد تیکت جدید</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: 'all', label: 'همه' },
          { value: 'open', label: 'باز' },
          { value: 'in_progress', label: 'در حال بررسی' },
          { value: 'waiting_user', label: 'منتظر پاسخ' },
          { value: 'closed', label: 'بسته شده' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === option.value
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : tickets.length === 0 ? (
        <Card className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">تیکتی وجود ندارد</h3>
          <p className="text-gray-500 mb-4">هنوز هیچ تیکت پشتیبانی ثبت نکرده‌اید</p>
          <Link to="/dashboard/tickets/new">
            <Button>ایجاد تیکت جدید</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const status = statusConfig[ticket.status] || statusConfig.open;
            const priority = priorityConfig[ticket.priority] || priorityConfig.medium;
            const StatusIcon = status.icon;

            return (
              <Link key={ticket._id} to={`/dashboard/tickets/${ticket._id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                          <StatusIcon className="w-3 h-3 inline ml-1" />
                          {status.label}
                        </span>
                        <span className={`text-xs ${priority.color}`}>
                          اولویت: {priority.label}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 truncate">{ticket.subject}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ticket.message}</p>
                    </div>
                    <div className="text-left text-sm text-gray-400">
                      <div>{toPersianDate(ticket.createdAt)}</div>
                      <div className="mt-1">
                        {toPersianNumber(ticket.responses?.length || 0)} پاسخ
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
