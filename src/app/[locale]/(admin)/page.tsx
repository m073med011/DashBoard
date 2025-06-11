"use client"
import React, { useState, useEffect } from 'react';
import { getData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import { TrendingUp, Users, UserCheck, Home, Clock, CheckCircle, XCircle, DollarSign, MapPin, Building2, Loader2, AlertCircle, ArrowUpRight, ArrowDownRight, BarChart3, PieChart } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface StatisticsData {
  total_customers: number;
  total_agents: number;
  total: number;
  cancelled: number;
  pending: number;
  accepted: number;
  for_sale: number;
  for_rent: number;
  immediate_delivery: number;
  average_price: number;
  total_price_for_sale: number;
  total_price_for_rent: number;
  by_area: Array<{ area_name: string; count: number }>;
  by_type: Array<{ type_name: string; count: number }>;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const StatCard = ({ title, value, icon: Icon, gradient, isLoading, subtitle, trend }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  gradient?: string;
  isLoading?: boolean;
  subtitle?: string;
  trend?: { value: number; isPositive: boolean };
}) => (
  <div className="group relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-6 hover:shadow-2xl hover:shadow-gray-900/15 transition-all duration-300 hover:-translate-y-1">
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${gradient || 'bg-gradient-to-br from-blue-600 to-purple-600'}`}></div>

    <div className="relative">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 group-hover:scale-110 transition-transform duration-300 ${gradient ? 'shadow-lg' : ''}`}>
          <Icon className="w-6 h-6 text-gray-700 group-hover:text-gray-900 transition-colors" />
        </div>
        {trend && (
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${trend.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
            {trend.isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
        {isLoading ? (
          <div className="flex items-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <div className="ml-3 space-y-2">
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 w-16 bg-gray-100 rounded animate-pulse"></div>
            </div>
          </div>
        ) : (
          <>
            <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
          </>
        )}
      </div>
    </div>
  </div>
);

const ModernChartCard =  ({ title, data, isLoading, icon: Icon }: {
  title: string;
  data: Array<{ name: string; count: number }>;
  isLoading?: boolean;
  icon: React.ElementType;
}) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-6 hover:shadow-2xl hover:shadow-gray-900/15 transition-all duration-300">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl">
          <Icon className="w-5 h-5 text-indigo-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
    </div>

    {isLoading ? (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-4 w-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded-full animate-pulse"></div>
          </div>
        ))}
      </div>
    ) : (
      <div className="space-y-4">
        {data.map((item, index) => {
          const maxCount = Math.max(...data.map(d => d.count));
          const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
          const colors = [
            'from-blue-500 to-cyan-500',
            'from-purple-500 to-pink-500',
            'from-green-500 to-emerald-500',
            'from-orange-500 to-red-500',
            'from-indigo-500 to-purple-500'
          ];

          return (
            <div key={index} className="group">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{item.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-gray-900">{item.count}</span>
                  <span className="text-xs text-gray-500">
                    {data.length > 0 ? ((item.count / data.reduce((sum, d) => sum + d.count, 0)) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
              <div className="relative w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${colors[index % colors.length]} rounded-full transition-all duration-700 ease-out group-hover:scale-105 origin-left`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

const ErrorCard = ({ message, onRetry, t }: { message: string; onRetry: () => void; t:  ReturnType<typeof useTranslations> }) => (
  <div className="col-span-full">
    <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200/50 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center">
        <div className="p-2 bg-red-100 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1 ml-4">
          <h3 className="text-sm font-semibold text-red-800">{t('unableToLoadDashboard')}</h3>
          <p className="text-sm text-red-600 mt-1">{message}</p>
        </div>
        <button
          onClick={onRetry}
          className="ml-4 px-6 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white text-sm font-medium rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
        >
          {t('retry')}
        </button>
      </div>
    </div>
  </div>
);

export default function DashBoard() {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('Home');

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error(t('authenticationTokenNotFound'));
      }

      const response = await getData('owner/statistics', {}, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
      }));

      if (response.data && response.status) {
        setStatistics(response.data);
      } else {
        throw new Error(response.msg || t('failedToFetchStatistics'));
      }
    } catch (error) {
      setError(t('failedToLoadData'));
      console.error(t('failedToFetchStatistics'), error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
        <div className="grid grid-cols-12 gap-6">
          <ErrorCard message={error} onRetry={fetchStatistics} t={t} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-12 gap-6">
        {/* Hero Stats */}
        <div className="col-span-12 lg:col-span-8">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 sm:col-span-6 lg:col-span-6">
              <StatCard
                title={t('totalProperties')}
                value={statistics?.total ?? 0}
                icon={Home}
                gradient="bg-gradient-to-br from-blue-600 to-cyan-600"
                isLoading={loading}
              />
            </div>

            <div className="col-span-12 sm:col-span-6 lg:col-span-6">
              <StatCard
                title={t('totalCustomers')}
                value={statistics?.total_customers ?? 0}
                icon={Users}
                gradient="bg-gradient-to-br from-emerald-600 to-green-600"
                isLoading={loading}
              />
            </div>

            <div className="col-span-12 sm:col-span-6 lg:col-span-6">
              <StatCard
                title={t('totalAgents')}
                value={statistics?.total_agents ?? 0}
                icon={UserCheck}
                gradient="bg-gradient-to-br from-purple-600 to-pink-600"
                isLoading={loading}
              />
            </div>

            <div className="col-span-12 sm:col-span-6 lg:col-span-6">
              <StatCard
                title={t('averagePrice')}
                value={statistics ? formatCurrency(statistics.average_price) : "$0"}
                icon={DollarSign}
                gradient="bg-gradient-to-br from-orange-600 to-red-600"
                isLoading={loading}
              />
            </div>
          </div>
        </div>

        {/* Status Overview */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-6 h-full hover:shadow-2xl hover:shadow-gray-900/15 transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{t('statusOverview')}</h3>
            </div>

            <div className="space-y-4">
              {[
                { label: t('accepted'), value: statistics?.accepted ?? 0, color: 'bg-emerald-500', icon: CheckCircle },
                { label: t('pending'), value: statistics?.pending ?? 0, color: 'bg-orange-500', icon: Clock },
                { label: t('cancelled'), value: statistics?.cancelled ?? 0, color: 'bg-red-500', icon: XCircle },
                { label: t('immediate'), value: statistics?.immediate_delivery ?? 0, color: 'bg-blue-500', icon: TrendingUp }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 ${item.color} rounded-lg`}>
                      <item.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-gray-700">{item.label}</span>
                  </div>
                  <span className="font-bold text-gray-900">{loading ? '...' : item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Property Types */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard
            title={t('forSale')}
            value={statistics?.for_sale ?? 0}
            icon={Home}
            gradient="bg-gradient-to-br from-indigo-600 to-blue-600"
            subtitle={statistics ? formatCurrency(statistics.total_price_for_sale) : undefined}
            isLoading={loading}
          />
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard
            title={t('forRent')}
            value={statistics?.for_rent ?? 0}
            icon={Building2}
            gradient="bg-gradient-to-br from-pink-600 to-rose-600"
            subtitle={statistics ? formatCurrency(statistics.total_price_for_rent) : undefined}
            isLoading={loading}
          />
        </div>

        <div className="col-span-12 lg:col-span-4">
          <StatCard
            title={t('totalPortfolioValue')}
            value={statistics ? formatCurrency(statistics.total_price_for_sale + statistics.total_price_for_rent) : "$0"}
            icon={DollarSign}
            gradient="bg-gradient-to-br from-green-600 to-emerald-600"
            isLoading={loading}
          />
        </div>

        {/* Charts */}
        <div className="col-span-12 lg:col-span-6">
          <ModernChartCard
            title={t('propertiesByArea')}
            data={statistics?.by_area.map(area => ({ name: area.area_name, count: area.count })) ?? []}
            isLoading={loading}
            icon={MapPin}
          />
        </div>

        <div className="col-span-12 lg:col-span-6">
          <ModernChartCard
            title={t('propertiesByType')}
            data={statistics?.by_type.map(type => ({ name: type.type_name, count: type.count })) ?? []}
            isLoading={loading}
            icon={PieChart}
          />
        </div>
      </div>
    </div>
  );
}