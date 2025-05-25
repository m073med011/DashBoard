"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function UserMetaCard() {
  const t = useTranslations("Profile");
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState({
    name: "",
    email: "",
    role: "",
    phone: "",
    second_phone: "",
    avatar: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: "",
      email: "",
      role: "",
      phone: "",
      second_phone: ""
    }
  });

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Set form default values
      setValue("name", parsedUser.name || "");
      setValue("email", parsedUser.email || "");
      setValue("role", parsedUser.role || "");
      setValue("phone", parsedUser.phone || "");
      setValue("second_phone", parsedUser.second_phone || "");
    }
  }, [setValue]);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const onSubmit = async (data: {name: string, email: string, role: string, phone: string, second_phone: string}) => {
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Create a FormData object
      const submitData = new FormData();
      
      // Add all required fields to match the exact format needed
      submitData.append('name', data.name);
      submitData.append('email', data.email);
      submitData.append('phone', data.phone);
      submitData.append('second_phone', data.second_phone);
      
      // Add avatar file if selected (optional)
      if (selectedFile) {
        submitData.append('avatar', selectedFile);
      }

      // Get token from localStorage
      const authToken = localStorage.getItem("token");

      // Make the API request with FormData
      const response = await axios.post(
        'https://lemonchiffon-octopus-104052.hostingersite.com/api/v1/dashboard/owner/profile/update',
        submitData, // This sends the data in the exact format needed
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      // Handle successful response
      if (response.data) {
        // Create updated user object with form data
        const updatedUser = { 
          ...user,
          name: data.name,
          email: data.email,
          role: data.role,
          phone: data.phone,
          second_phone: data.second_phone
        };
        
        // If a file was selected, update the avatar preview in the UI only
        if (selectedFile) {
          updatedUser.avatar = URL.createObjectURL(selectedFile);
        }
        
        // Update localStorage with new user data
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        setMessage({ 
          type: "success", 
          text: "Profile updated successfully!" 
        });
        
        // Close modal after short delay
        setTimeout(() => {
          closeModal();
          setMessage({ type: "", text: "" });
        }, 1500);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ 
        type: "error", 
        text: "Failed to update profile. Please try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <Image
                width={80}
                height={80}
                src={user?.avatar || "/images/user/owner.jpg"}
                alt="user"
              />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {user.name || t("User not found")}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.role || t("User not found")}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.email || t("User not found")}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            {t("Edit")}
          </button>
        </div>
      </div>
      
      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-99999 bg-black/50 dark:bg-black/60 flex items-center justify-center">
          <div className="fixed inset-0" onClick={closeModal}></div>
          <div className="no-scrollbar relative w-full max-w-[700px] m-4 overflow-y-auto rounded-3xl bg-white backdrop-blur-sm p-4 dark:bg-black lg:p-11 z-10">
            <div className="px-2 pr-14">
              <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                {t("Edit Personal Information")}
              </h4>
              <button 
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            {message.text && (
              <div className={`px-2 mb-4 text-sm ${message.type === "success" ? "text-green-500" : "text-red-500"}`}>
                {message.text}
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
              <div className="custom-scrollbar h-[410px] overflow-y-auto px-2 pb-3">
                <div className="mt-7">
                  <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                    {t("Personal Information")}
                  </h5>

                  <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                    <div className="col-span-2 lg:col-span-1">
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("Name")}</label>
                      <input 
                        type="text"
                        className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:focus:border-brand-500"
                        {...register("name")}
                      />
                      {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("Email")}</label>
                      <input 
                        type="email"
                        className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:focus:border-brand-500"
                        {...register("email")}
                      />
                      {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("Phone")}</label>
                      <input 
                        type="text"
                        className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:focus:border-brand-500"
                        {...register("phone")}
                      />
                      {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("Secondary phone")}</label>
                      <input 
                        type="text"
                        className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:focus:border-brand-500"
                        {...register("second_phone")}
                      />
                      {errors.second_phone && <p className="mt-1 text-xs text-red-500">{errors.second_phone.message}</p>}
                    </div>

                    <div className="col-span-2">
  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
    {t("Avatar (Optional)")}
  </label>

  <label
    htmlFor="avatar-upload"
    className="block cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-3 text-center text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
  >
    {selectedFile ? selectedFile.name : t("Choose an image")}
  </label>

  <input
    id="avatar-upload"
    type="file"
    accept="image/*"
    className="hidden"
    onChange={handleFileChange}
  />

  {selectedFile && (
    <div className="mt-2">
      <p className="text-sm text-gray-500">{t("New file selected")}: {selectedFile.name}</p>
      <button
        type="button"
        onClick={() => setSelectedFile(null)}
        className="mt-1 text-xs text-red-500 hover:text-red-700"
      >
        {t("Remove selected file")}
      </button>
    </div>
  )}
</div>

                  </div>
                </div>
                <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                  <button 
                    type="button"
                    onClick={closeModal}
                    className="inline-flex items-center justify-center font-medium gap-2 rounded-lg transition px-4 py-3 text-sm bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300"
                    disabled={isLoading}
                  >
                    {t("Close")}
                  </button>
                  <button 
                    type="submit"
                    className="inline-flex items-center justify-center font-medium gap-2 rounded-lg transition px-4 py-3 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300"
                    disabled={isLoading}
                  >
                    {isLoading ? t("Saving...") : t("Save Changes")}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}