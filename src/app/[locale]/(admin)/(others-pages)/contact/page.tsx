"use client";
import { useState, useEffect } from "react";
import { AxiosHeaders } from "axios";
import { getData } from "../../../../../libs/axios/server";
import { useTranslations, useLocale } from "next-intl";

interface Contact {
  id: number;
  property_id: number | null;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

interface ApiResponse {
  status: number;
  msg: string;
  data: {
    contacts: Contact[];
  };
}

interface SingleContactApiResponse {
  status: number;
  msg: string;
  data: {
    contact: Contact;
  };
}

const ContactPage = () => {
  const locale = useLocale();
  const t = useTranslations("contact");

  const [activeTab, setActiveTab] = useState<"all" | "search">("all");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Check if current locale is RTL
  const isRTL = locale === 'ar';

  // Get auth token from localStorage
  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || localStorage.getItem("authToken") || "";
    }
    return "";
  };

  // Create headers with auth and locale
  const createHeaders = () => {
    const authToken = getAuthToken();
    return new AxiosHeaders({
      lang: locale,
      Authorization: `Bearer ${authToken}`,
    });
  };

  // Mount animation
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch contacts data
  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = createHeaders();
        const response: ApiResponse = await getData("owner/contacts", {}, headers);
        if (response.status === 200 && response.data) {
          setContacts(response.data.contacts);
        }
      } catch (err) {
        setError(t("errors.fetchFailed"));
        console.error("Error fetching contacts:", err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === "all" && mounted) {
      fetchContacts();
    }
  }, [activeTab, locale, mounted, t]);

  // Handle search by ID
  const handleSearch = async () => {
    if (searchTerm.trim() === "") return;

    setLoading(true);
    setError(null);
    try {
      const headers = createHeaders();
      const contactId = parseInt(searchTerm.trim());
      
      // Check if search term is a valid number for ID search
      if (isNaN(contactId)) {
        setError(t("errors.invalidId"));
        setFilteredContacts([]);
        setLoading(false);
        return;
      }

      const response: SingleContactApiResponse = await getData(`owner/contacts/${contactId}`, {}, headers);
      
      if (response.status === 200 && response.data && response.data.contact) {
        setFilteredContacts([response.data.contact]);
        setError(null);
      } else {
        setFilteredContacts([]);
        setError(t("errors.notFound"));
      }
    } catch {
      console.error("Error searching contact:");
      setFilteredContacts([]);
    } finally {
      setLoading(false);
    }
  };

  // Clear search results when switching tabs or clearing search term
  useEffect(() => {
    if (activeTab === "search" && searchTerm.trim() === "") {
      setFilteredContacts([]);
      setError(null);
    }
  }, [searchTerm, activeTab]);

  const formatDate = (dateString: string) => {
    const dateFormat = isRTL ? 'ar-SA' : 'en-US';
    return new Date(dateString).toLocaleDateString(dateFormat, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const ContactCard = ({ contact, index }: { contact: Contact; index: number }) => (
    <div 
      className={`group relative bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 hover:bg-white animate-fade-in-up overflow-hidden`}
      style={{
        animationDelay: `${index * 100}ms`,
        animationFillMode: 'both'
      }}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0"></div>
      
      {/* Animated border */}
      <div className="absolute inset-0 rounded-2xl"></div>
      
      <div className="relative z-10">
        <div className={`flex justify-between items-start mb-4 `}>
          <div className={`flex items-center space-x-3`}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm group-hover:scale-110 transition-transform duration-300" style={{backgroundColor: '#F26A3F'}}>
              {contact.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-orange-700 transition-colors duration-300">
                {contact.name}
              </h3>
              <span className="text-xs text-gray-500 font-mono">{t("contactCard.idLabel")} {contact.id}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className={`flex items-center space-x-2`}>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
            <p className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">{contact.email}</p>
          </div>

          {contact.property_id && (
            <div className={`flex items-center space-x-2`}>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-sm bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent font-medium">
                {t("contactCard.propertyLabel")} {contact.property_id}
              </span>
            </div>
          )}

          <div className="relative">
            <p className="text-gray-700 text-sm leading-relaxed group-hover:text-gray-900 transition-colors duration-300 line-clamp-3">
              {contact.message}
            </p>
            <div className={`absolute bottom-0 bg-gradient-to-l from-white group-hover:from-white via-white/90 to-transparent w-8 h-6 ${isRTL ? 'left-0' : 'right-0'}`}></div>
          </div>

          <div className={`flex items-center space-x-2 pt-2 border-t border-gray-100 group-hover:border-gray-200 transition-colors duration-300`}>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors duration-300">
              {formatDate(contact.created_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const LoadingSpinner = () => (
    <div className="flex justify-center py-16">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200"></div>
        <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-transparent border-t-orange-500 animate-spin" style={{borderTopColor: '#F26A3F'}}></div>
        <div className="absolute top-1 left-1 w-10 h-10 rounded-full border-4 border-transparent border-t-red-500 animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s', borderTopColor: '#F26A3F'}}></div>
      </div>
    </div>
  );

  const EmptyState = ({ title, subtitle, icon }: { title: string; subtitle: string; icon: React.ReactNode }) => (
    <div className="text-center py-16 animate-fade-in">
      <div className="mb-6 flex justify-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500">{subtitle}</p>
    </div>
  );

  if (!mounted) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50"></div>;
  }

  return (
    <div className={`min-h-screen ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 animate-fade-in-down">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
              {t("title")}
            </h1>
            <p className="text-gray-600 text-lg">{t("subtitle")}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8 animate-fade-in" style={{animationDelay: '200ms', animationFillMode: 'both'}}>
          <nav className={`-mb-px flex space-x-8`}>
            <button
              onClick={() => setActiveTab("all")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                activeTab === "all"
                  ? "text-orange-600 hover:text-orange-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              style={activeTab === "all" ? {
                borderBottomColor: '#F26A3F'
              } : {}}
            >
              {t("tabs.allContacts")}
            </button>
            <button
              onClick={() => setActiveTab("search")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                activeTab === "search"
                  ? "text-orange-600 hover:text-orange-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              style={activeTab === "search" ? {
                borderBottomColor: '#F26A3F'
              } : {}}
            >
              {t("tabs.search")}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in" style={{animationDelay: '400ms', animationFillMode: 'both'}}>
          {activeTab === "all" && (
            <div>
              {loading ? (
                <LoadingSpinner />
              ) : error ? (
                <div className="text-center py-16 animate-shake">
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">{t("errors.somethingWrong")}</h3>
                    <p className="text-red-600">{error}</p>
                  </div>
                </div>
              ) : contacts.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {contacts.map((contact, index) => (
                    <ContactCard key={contact.id} contact={contact} index={index} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={t("emptyStates.noContacts.title")}
                  subtitle={t("emptyStates.noContacts.subtitle")}
                  icon={
                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  }
                />
              )}
            </div>
          )}

          {activeTab === "search" && (
            <div>
              {/* Modern Search Input */}
              <div className="mb-8">
                <div className="max-w-2xl mx-auto">
                  <div className="relative group">
                    <div className="absolute inset-0 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className={`relative flex bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 `}>
                      <input
                        type="text"
                        placeholder={t("search.placeholder")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                        className={`flex-1 px-4 py-4 bg-transparent outline-none placeholder-gray-400 text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}
                      />
                      <button
                        onClick={handleSearch}
                        disabled={loading || searchTerm.trim() === ""}
                        className={`px-8 py-4 text-black transition-all duration-300 font-medium shadow-lg disabled:shadow-none transform hover:scale-[1.02] disabled:scale-100 ${isRTL ? 'rounded-l-2xl' : 'rounded-r-2xl'}`}
                      >
                        {loading ? (
                          <div className={`flex items-center space-x-2`}>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>{t("search.searching")}</span>
                          </div>
                        ) : (
                          t("search.button")
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Results */}
              {searchTerm.trim() === "" ? (
                <EmptyState
                  title={t("search.readyTitle")}
                  subtitle={t("search.readySubtitle")}
                  icon={
                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
              ) : loading ? (
                <LoadingSpinner />
              ) : error ? (
                <div className="text-center py-16 animate-shake">
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">{t("errors.searchError")}</h3>
                    <p className="text-red-600">{error}</p>
                  </div>
                </div>
              ) : filteredContacts.length > 0 ? (
                <div className="animate-fade-in">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredContacts.map((contact, index) => (
                      <ContactCard key={contact.id} contact={contact} index={index} />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fade-in-up {
          from { 
            opacity: 0; 
            transform: translateY(30px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-down {
          from { 
            opacity: 0; 
            transform: translateY(-30px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
        
        .animate-fade-in-down {
          animation: fade-in-down 0.6s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-out;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ContactPage;