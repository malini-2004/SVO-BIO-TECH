"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { User, Mail, MapPin, Phone, ShieldCheck, Edit2 } from "lucide-react";
import Link from "next/link";
import { Address } from "@/types";
import { toast } from "sonner";
import { fetchPincodeDetails } from "@/lib/api/pincode";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  
  // Mock addresses since we aren't saving them to Firestore yet in this boilerplate
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: "1",
      fullName: "Manoj Kumar",
      phone: "9876543210",
      pincode: "600001",
      street: "123 Agri Lane, Parrys",
      city: "Chennai",
      state: "Tamil Nadu",
      isDefault: true
    }
  ]);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: "", phone: "", pincode: "", street: "", city: "", state: ""
  });
  const [isFetchingPin, setIsFetchingPin] = useState(false);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div></div>;

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <ShieldCheck size={64} className="text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
        <p className="text-gray-500 mb-6">Please log in to view your profile and saved addresses.</p>
        <Link href="/admin/login" className="bg-primary-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-primary-700 transition">
          Login Now
        </Link>
      </div>
    );
  }

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pin = e.target.value;
    setNewAddress(prev => ({ ...prev, pincode: pin }));
    if (pin.length === 6) {
      setIsFetchingPin(true);
      const details = await fetchPincodeDetails(pin);
      if (details) {
        setNewAddress(prev => ({ ...prev, city: details.city, state: details.state }));
        toast.success("Location auto-filled");
      }
      setIsFetchingPin(false);
    }
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const address: Address = {
      id: Date.now().toString(),
      ...newAddress,
      isDefault: addresses.length === 0
    };
    setAddresses([...addresses, address]);
    setIsAdding(false);
    toast.success("Address saved to address book");
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Account</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-2xl font-bold uppercase">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 line-clamp-1">{user.displayName || "Agri User"}</h3>
                  <p className="text-sm text-gray-500 line-clamp-1">{user.email}</p>
                </div>
              </div>
              <div className="p-2">
                <Link href="/profile" className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 text-primary-700 font-bold mb-1">
                  <User size={20} /> Personal Info
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Personal Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                <button className="text-primary-600 font-bold text-sm hover:underline flex items-center gap-1">
                  <Edit2 size={14} /> Edit
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1 flex items-center gap-2"><User size={12}/> Full Name</p>
                  <p className="font-medium text-gray-900">{user.displayName || "Not set"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1 flex items-center gap-2"><Mail size={12}/> Email Address</p>
                  <p className="font-medium text-gray-900">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1 flex items-center gap-2"><Phone size={12}/> Phone Number</p>
                  <p className="font-medium text-gray-900">+91 98765 43210</p>
                </div>
              </div>
            </div>

            {/* Address Book Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="text-primary-600" /> Address Book
                </h2>
                {!isAdding && (
                  <button 
                    onClick={() => setIsAdding(true)}
                    className="text-primary-600 font-bold text-sm hover:underline"
                  >
                    + Add New
                  </button>
                )}
              </div>

              {isAdding ? (
                <form onSubmit={handleSaveAddress} className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-4">Add Delivery Address</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <input required placeholder="Full Name" className="p-3 border border-gray-300 rounded-lg outline-none focus:border-primary-500" value={newAddress.fullName} onChange={e => setNewAddress({...newAddress, fullName: e.target.value})} />
                    <input required placeholder="Phone Number" className="p-3 border border-gray-300 rounded-lg outline-none focus:border-primary-500" value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} />
                  </div>
                  <div className="mb-4 relative">
                    <input required placeholder="Pincode (Auto-fills City)" maxLength={6} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-primary-500" value={newAddress.pincode} onChange={handlePincodeChange} />
                    {isFetchingPin && <div className="absolute right-3 top-3 animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full"></div>}
                  </div>
                  <textarea required placeholder="Street / Village / Area" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-primary-500 mb-4" rows={2} value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})}></textarea>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <input required readOnly placeholder="City" className="p-3 border border-gray-300 rounded-lg bg-gray-100 outline-none" value={newAddress.city} />
                    <input required readOnly placeholder="State" className="p-3 border border-gray-300 rounded-lg bg-gray-100 outline-none" value={newAddress.state} />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700">Save Address</button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map(address => (
                    <div key={address.id} className="border border-gray-200 rounded-xl p-5 relative group">
                      {address.isDefault && <span className="absolute top-0 right-0 bg-primary-100 text-primary-700 text-xs font-bold px-2 py-1 rounded-bl-xl rounded-tr-xl">Default</span>}
                      <p className="font-bold text-gray-900 mb-1">{address.fullName}</p>
                      <p className="text-sm text-gray-600 line-clamp-1">{address.street}</p>
                      <p className="text-sm text-gray-600">{address.city}, {address.state} - {address.pincode}</p>
                      <p className="text-sm font-medium text-gray-800 mt-2">Ph: {address.phone}</p>
                      <div className="mt-4 flex gap-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-primary-600 font-bold hover:underline">Edit</button>
                        <button className="text-red-500 font-bold hover:underline">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
