"use client";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebar } from "@/context/SidebarContext";
import { routing, usePathname, useRouter } from "@/i18n/routing";
// import { CheckCircleIcon, ChevronDownIcon } from "@/icons";

import { useLocale } from "next-intl";
// import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useState ,useEffect,useRef} from "react";

// const flagMap: Record<string, string> = {
//   en: "gb",
//   ar: "sa",
// };

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);

  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const changeLanguage = (l: string) => {
    const paramsString = searchParams.toString();
    const url = paramsString ? `${pathname}?${paramsString}` : pathname;

    router.replace(url, { locale: l });
    setLangOpen(false);
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200 z-9 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          <button
            className="items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg z-99999 dark:border-gray-800 lg:flex dark:text-gray-400 lg:h-11 lg:w-11 lg:border"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg
                width="16"
                height="12"
                viewBox="0 0 16 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                  fill="currentColor"
                />
              </svg>
            )}
            {/* Cross Icon */}
          </button>

          <Link href="/" className="lg:hidden">
          <>
             <svg
                     style={{
                        width: "clamp(150px,10.78125vw,207px)",
                        height: "clamp(45px,3.125vw,60px)",
                     }}
                     viewBox="0 0 207 60"
                     fill="none"
                     xmlns="http://www.w3.org/2000/svg"
                  >
                     <path
                        d="M23.8976 0.846404L23.7678 0.75L23.6381 0.860179L0 20.9811V47.816L19.3229 58.8543C21.303 59.9905 23.761 58.5444 23.761 56.2444V51.1075V43.285V43.3263C23.7679 43.1197 23.761 42.9131 23.761 42.7134C23.6586 38.809 22.6071 36.3645 22.1701 35.5106C22.1018 35.3867 22.0541 35.2972 22.0199 35.2352C22.0063 35.2145 21.9926 35.1939 21.9789 35.1663V35.1595C21.856 34.9391 21.7263 34.7256 21.5966 34.519C19.1932 30.656 15.5266 27.6812 11.1772 26.1801C17.179 24.1074 21.897 19.2183 23.7678 13.076C25.6387 19.2183 30.3499 24.1005 36.3585 26.1801C32.0091 27.6812 28.3425 30.656 25.9391 34.519H48V17.9444L23.9044 0.853286L23.8976 0.846404Z"
                        fill="#F26A3F"
                     />
                     <path
                        d="M85.2817 11.6515C83.6499 10.8852 81.7804 10.502 79.6598 10.502H68V41.6367H73.7275V30.142H79.6598C81.7738 30.142 83.6433 29.7589 85.2618 28.9926C86.8803 28.2263 88.1487 27.1098 89.0868 25.6499C90.0183 24.1899 90.4873 22.4261 90.4873 20.365C90.4873 18.3039 90.0249 16.4542 89.1066 14.9942C88.1884 13.5343 86.9134 12.4178 85.2817 11.6515ZM84.152 22.8291C83.7226 23.5557 83.1281 24.1173 82.375 24.5202C81.6219 24.9232 80.7432 25.128 79.7391 25.128H73.7209V15.5161H79.7391C80.7432 15.5161 81.6219 15.7209 82.375 16.1238C83.1281 16.5268 83.716 17.0883 84.152 17.7952C84.5814 18.5087 84.7994 19.3476 84.7994 20.3253C84.7994 21.303 84.5814 22.109 84.152 22.8357V22.8291Z"
                        fill="#231F20"
                     />
                     <path
                        d="M101.867 19.6516C101.001 20.1669 100.314 20.986 99.7991 22.1091V18.8985H94.6133V41.6368H100.129V28.9728C100.129 27.2486 100.605 25.9076 101.55 24.9629C102.494 24.0182 103.75 23.5426 105.309 23.5426H107.271V18.6541H105.936C104.351 18.6541 102.99 18.991 101.86 19.6582L101.867 19.6516Z"
                        fill="#231F20"
                     />
                     <path
                        d="M127.469 19.9488C125.659 18.9182 123.624 18.4029 121.365 18.4029C119.105 18.4029 117.117 18.9182 115.307 19.9488C113.497 20.9793 112.043 22.3864 110.96 24.1701C109.876 25.9537 109.328 27.9884 109.328 30.2741C109.328 32.5598 109.87 34.5945 110.96 36.3782C112.043 38.1618 113.503 39.5689 115.327 40.5995C117.15 41.6301 119.165 42.1453 121.365 42.1453C123.564 42.1453 125.612 41.6301 127.422 40.5995C129.232 39.5689 130.686 38.1618 131.769 36.3782C132.853 34.5945 133.401 32.5598 133.401 30.2741C133.401 27.9884 132.866 25.9207 131.789 24.1502C130.719 22.3798 129.272 20.9793 127.462 19.9488H127.469ZM126.867 33.8018C126.326 34.8456 125.586 35.6647 124.654 36.2461C123.723 36.834 122.626 37.1247 121.371 37.1247C120.116 37.1247 119.059 36.834 118.108 36.2461C117.163 35.6581 116.417 34.8456 115.875 33.8018C115.333 32.758 115.062 31.5821 115.062 30.2675C115.062 28.9529 115.333 27.7902 115.875 26.7597C116.417 25.7291 117.163 24.9232 118.108 24.3352C119.052 23.7473 120.142 23.4566 121.371 23.4566C122.6 23.4566 123.716 23.7473 124.654 24.3352C125.586 24.9232 126.326 25.7291 126.867 26.7597C127.409 27.7902 127.68 28.9595 127.68 30.2675C127.68 31.5755 127.409 32.7514 126.867 33.8018Z"
                        fill="#231F20"
                     />
                     <path
                        d="M155.807 19.9884C154.076 18.9314 152.14 18.4029 150 18.4029C148.243 18.4029 146.697 18.7464 145.362 19.4269C144.292 19.9752 143.4 20.6952 142.687 21.5937V18.905H137.501V50H143.017V39.4566C143.691 40.1701 144.49 40.7448 145.422 41.1808C146.802 41.8216 148.315 42.1453 149.954 42.1453C152.153 42.1453 154.115 41.6235 155.846 40.5797C157.57 39.5359 158.938 38.109 159.942 36.2989C160.946 34.4888 161.448 32.4806 161.448 30.2807C161.448 28.0809 160.94 26.0462 159.922 24.2626C158.905 22.4789 157.531 21.0586 155.807 20.0016V19.9884ZM154.928 33.8216C154.373 34.8522 153.613 35.6581 152.649 36.2461C151.684 36.834 150.581 37.1247 149.326 37.1247C148.071 37.1247 147.047 36.834 146.089 36.2461C145.131 35.6581 144.378 34.8522 143.83 33.8216C143.288 32.7911 143.017 31.6086 143.017 30.2675C143.017 28.9265 143.288 27.7902 143.83 26.7597C144.371 25.7291 145.124 24.9232 146.089 24.3352C147.053 23.7473 148.13 23.4566 149.326 23.4566C150.522 23.4566 151.684 23.7473 152.649 24.3352C153.613 24.9232 154.366 25.7291 154.928 26.7597C155.483 27.7902 155.767 28.9595 155.767 30.2675C155.767 31.5755 155.489 32.7911 154.928 33.8216Z"
                        fill="#231F20"
                     />
                     <path
                        d="M171.101 10H165.585V41.6367H171.101V10Z"
                        fill="#231F20"
                     />
                     <path
                        d="M181.634 18.9051H176.118V41.6433H181.634V18.9051Z"
                        fill="#231F20"
                     />
                     <path
                        d="M181.634 10.502H176.118V16.3551H181.634V10.502Z"
                        fill="#231F20"
                     />
                     <path
                        d="M207 18.9051H200.605L195.822 25.967L191.04 18.9051H184.599L192.585 30.2279L184.645 41.6367H191.079L195.822 34.5682L200.566 41.6367H206.96L199.059 30.2279L207 18.9051Z"
                        fill="#231F20"
                     />
                  </svg>
            </>
          </Link>

          <button
            onClick={toggleApplicationMenu}
            className="flex items-center justify-center w-10 h-10 text-gray-700 rounded-lg z-99999 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z"
                fill="currentColor"
              />
            </svg>
          </button>

          {/* <div className="hidden lg:block">
            <form>
              <div className="relative">
                <span className="absolute -translate-y-1/2 left-4 top-1/2 pointer-events-none">
                  <svg
                    className="fill-gray-500 dark:fill-gray-400"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                      fill=""
                    />
                  </svg>
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search or type command..."
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
                />

                <button className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                  <span> ⌘ </span>
                  <span> K </span>
                </button>
              </div>
            </form>
          </div> */}
        </div>
        <div
          className={`${
            isApplicationMenuOpen ? "flex" : "hidden"
          } items-center justify-between w-full gap-4 px-5 py-4 lg:flex shadow-theme-md lg:justify-end lg:px-0 lg:shadow-none`}
        >
          <div className="flex items-center gap-2 2xsm:gap-3">
          <div className="relative">
                  <button
                    onClick={() => setLangOpen((o) => !o)}
                    className="flex items-center rounded-[clamp(10px,0.833vw,20px)] font-['Libre_Baskerville'] text-[clamp(14px,1.042vw,20px)] font-[400] py-[clamp(3px,0.417vw,5px)] px-[clamp(5px,1.562vw,10px)] justify-center gap-2 cursor-pointer transition focus:outline-none border border-transparent hover:border-gray-300 dark:hover:border-white/40 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500/30 dark:focus:ring-brand-500/30"
                    aria-haspopup="listbox"
                    aria-expanded={langOpen}
                  >
                    {locale === "en" ? (
                      <span>EN</span>
                    ) : locale === "ar" ? (
                      <span>AR</span>
                    ) : null}
                   
                  </button>
                  <div className="" ref={langRef}>
                    <div
                      className={`absolute  mt-2  border border-gray-200 dark:border-gray-700 bg-white bg-opacity-95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl transform origin-top-left transition-all duration-150 ${
                        langOpen
                          ? "opacity-100 scale-100 pointer-events-auto"
                          : "opacity-0 scale-95 pointer-events-none"
                      }`}
                    >
                      <ul className="divide-y divide-gray-100">
                        {routing.locales.map((l) => (
                          <li key={l}>
                            <button
                              onClick={() => changeLanguage(l)}
                              className="w-full flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-xl text-gray-800 dark:text-white"
                            >
{l === "en" ? (
  <div className="flex gap-2 items-center">EN</div>
) : l === "ar" ? (
  <div className="flex gap-2 items-center">AR</div>
) : null}
                              
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
            {/* <!-- Dark Mode Toggler --> */}
            <ThemeToggleButton />
            {/* <!-- Dark Mode Toggler --> */}

          </div>
          {/* <!-- User Area --> */}
          <UserDropdown /> 
    
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
