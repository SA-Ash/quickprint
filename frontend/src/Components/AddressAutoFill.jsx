import { useState } from "react";
import { MapPin, Loader2, Check } from "lucide-react";

const AddressAutoFill = ({ onAddressUpdate, currentAddress = {} }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const fetchAddress = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await response.json();
          
          if (data && data.address) {
            const addr = data.address;
            onAddressUpdate({
              street: currentAddress.street || "",
              city: addr.city || addr.town || addr.village || addr.county || "",
              state: addr.state || "",
              pincode: addr.postcode || "",
              lat: latitude,
              lng: longitude,
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
          } else {
            setError("Could not fetch address details");
          }
        } catch (err) {
          setError("Failed to fetch address");
        }
        setLoading(false);
      },
      (err) => {
        if (err.code === 1) setError("Location access denied");
        else if (err.code === 2) setError("Location unavailable");
        else setError("Location request timed out");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <button
      type="button"
      onClick={fetchAddress}
      disabled={loading}
      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        success
          ? "bg-green-100 text-green-700 border border-green-300"
          : error
          ? "bg-red-100 text-red-700 border border-red-300"
          : "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
      }`}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Detecting...
        </>
      ) : success ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Address Updated
        </>
      ) : (
        <>
          <MapPin className="h-4 w-4 mr-2" />
          {error || "Use My Location"}
        </>
      )}
    </button>
  );
};

export default AddressAutoFill;
