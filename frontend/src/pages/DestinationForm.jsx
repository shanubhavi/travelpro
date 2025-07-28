import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { destinationsAPI } from "../services/api";

const initialState = {
  name: "",
  country: "",
  region: "",
  overview: "",
  bestTimeToVisit: "",
  visaRules: "",
  attractions: "",
  localTips: "",
  salesPoints: "",
  currency: "",
  language: "",
  timeZone: "",
  climate: {
    spring: "",
    summer: "",
    autumn: "",
    winter: "",
  },
};

const DestinationForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit) {
      loadDestination();
    }
  }, [id, isEdit]);

  const loadDestination = async () => {
    try {
      setFetchLoading(true);
      setError("");

      console.log("🔍 Loading destination with ID:", id);

      const res = await destinationsAPI.getById(id);
      console.log("📡 API response:", res);

      if (!res || !res.data) {
        setError("No data received from API");
        return;
      }

      // Handle different response structures
      let destination;
      if (res.data.success && res.data.data) {
        destination = res.data.data;
      } else if (res.data) {
        destination = res.data;
      } else {
        setError("No destination data found");
        return;
      }

      console.log("🔄 Processing destination data:", destination);
      console.log("🔍 Raw destination content fields:");
      console.log("  - attractions:", destination.attractions);
      console.log("  - localTips:", destination.localTips);
      console.log("  - salesPoints:", destination.salesPoints);

      // Helper function to convert arrays to strings for form display
      const arrayToString = (arr) => {
        console.log("Converting array to string:", arr, typeof arr);

        if (!arr) {
          console.log("  -> Empty string (no data)");
          return "";
        }

        // If it's already an array of objects (from new dual-table structure)
        if (Array.isArray(arr) && arr.length > 0) {
          // Check if it's array of objects with content property
          if (typeof arr[0] === "object" && arr[0] !== null && arr[0].content) {
            const result = arr.map((item) => item.content).join("\n");
            console.log("  -> Converted object array to string:", result);
            return result;
          }
          // If it's array of strings
          if (typeof arr[0] === "string") {
            const result = arr.join("\n");
            console.log("  -> Converted string array to string:", result);
            return result;
          }
        }

        // If it's a simple array
        if (Array.isArray(arr)) {
          const result = arr.join("\n");
          console.log("  -> Converted simple array to string:", result);
          return result;
        }

        // If it's a JSON string, try to parse it
        if (typeof arr === "string") {
          try {
            const parsed = JSON.parse(arr);
            if (Array.isArray(parsed)) {
              const result = parsed.join("\n");
              console.log("  -> Converted JSON string to string:", result);
              return result;
            }
            console.log("  -> Returned original string:", arr);
            return arr;
          } catch (e) {
            // If it's not JSON, just return as string
            console.log("  -> Returned as plain string:", arr);
            return arr;
          }
        }

        console.log("  -> Empty string (unknown format)");
        return "";
      };

      // Helper function to handle climate data
      const processClimate = (climate) => {
        console.log("Processing climate:", climate, typeof climate);

        if (!climate) return initialState.climate;

        // If it's already an object
        if (typeof climate === "object" && climate !== null) {
          return {
            spring: climate.spring || "",
            summer: climate.summer || "",
            autumn: climate.autumn || "",
            winter: climate.winter || "",
          };
        }

        // If it's a JSON string
        if (typeof climate === "string") {
          try {
            const parsed = JSON.parse(climate);
            return {
              spring: parsed.spring || "",
              summer: parsed.summer || "",
              autumn: parsed.autumn || "",
              winter: parsed.winter || "",
            };
          } catch (e) {
            console.warn("Failed to parse climate JSON:", e);
            return initialState.climate;
          }
        }

        return initialState.climate;
      };

      // Map all fields with proper data processing
      const newFormData = {
        name: destination.name || "",
        country: destination.country || "",
        region: destination.region || "",
        overview: destination.overview || "",
        bestTimeToVisit:
          destination.best_time_to_visit || destination.bestTimeToVisit || "",
        visaRules: destination.visa_rules || destination.visaRules || "",
        currency: destination.currency || "",
        language: destination.language || "",
        timeZone: destination.time_zone || destination.timeZone || "",
        climate: processClimate(destination.climate),
        // ✅ Fixed: Convert content arrays to strings for form editing
        attractions: arrayToString(destination.attractions, "attractions"),
        localTips: arrayToString(destination.localTips, "localTips"),
        salesPoints: arrayToString(destination.salesPoints, "salesPoints"),
      };

      console.log("✅ Mapped form data:");
      console.log("  - name:", newFormData.name);
      console.log("  - attractions (length):", newFormData.attractions?.length);
      console.log("  - attractions (content):", newFormData.attractions);
      console.log("  - localTips (length):", newFormData.localTips?.length);
      console.log("  - localTips (content):", newFormData.localTips);
      console.log("  - salesPoints (length):", newFormData.salesPoints?.length);
      console.log("  - salesPoints (content):", newFormData.salesPoints);

      console.log("🎯 Setting form state with new data...");
      setForm(newFormData);

      // Force a small delay to ensure state is set
      setTimeout(() => {
        console.log("🔍 Form state after setting:", {
          attractions: form.attractions?.length,
          localTips: form.localTips?.length,
          salesPoints: form.salesPoints?.length,
        });
      }, 100);
    } catch (err) {
      console.error("❌ Error loading destination:", err);
      setError(`Failed to load destination: ${err.message}`);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("climate.")) {
      const season = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        climate: {
          ...prev.climate,
          [season]: value,
        },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    setError("");

    try {
      console.log("🚀 === FORM SUBMISSION ===");
      console.log("📋 Form data before processing:", form);

      // Validate required fields
      const requiredFields = ["name", "country"];
      const missingFields = requiredFields.filter(
        (field) => !form[field]?.trim()
      );

      if (missingFields.length > 0) {
        const errorMsg = `Missing required fields: ${missingFields.join(", ")}`;
        console.error("❌ Validation failed:", errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      // ✅ Enhanced: Process list fields - convert from strings to arrays
      const processListField = (fieldValue, fieldName) => {
        console.log(`🔄 Processing ${fieldName}:`, fieldValue);

        if (!fieldValue || typeof fieldValue !== "string") {
          console.log(`  ${fieldName} -> Empty array (no value)`);
          return [];
        }

        const result = fieldValue
          .split("\n")
          .map((item) => item.trim())
          .filter((item) => item.length > 0);

        console.log(
          `  ${fieldName} -> Array with ${result.length} items:`,
          result
        );
        return result;
      };

      // Process climate data
      const processClimate = (climate) => {
        if (!climate || typeof climate !== "object") return null;

        const hasData = Object.values(climate).some(
          (value) => value && value.trim()
        );
        if (!hasData) return null;

        return {
          spring: climate.spring?.trim() || "",
          summer: climate.summer?.trim() || "",
          autumn: climate.autumn?.trim() || "",
          winter: climate.winter?.trim() || "",
        };
      };

      // ✅ Enhanced: Prepare data for backend with detailed logging
      const processedData = {
        name: form.name.trim(),
        country: form.country.trim(),
        region: form.region?.trim() || "",
        overview: form.overview?.trim() || "",
        bestTimeToVisit: form.bestTimeToVisit?.trim() || "",
        visaRules: form.visaRules?.trim() || "",
        currency: form.currency?.trim() || "",
        language: form.language?.trim() || "",
        timeZone: form.timeZone?.trim() || "",
        climate: processClimate(form.climate),
        // ✅ Convert textarea content to arrays
        attractions: processListField(form.attractions, "attractions"),
        localTips: processListField(form.localTips, "localTips"),
        salesPoints: processListField(form.salesPoints, "salesPoints"),
        status: "published",
        featured: false,
      };

      console.log("🎯 Final processed data to send:", processedData);
      console.log("📊 Content arrays:");
      console.log(
        "  - Attractions:",
        processedData.attractions.length,
        "items"
      );
      console.log("  - Local Tips:", processedData.localTips.length, "items");
      console.log(
        "  - Sales Points:",
        processedData.salesPoints.length,
        "items"
      );

      let response;
      if (isEdit) {
        console.log("🔄 Calling update API for ID:", id);
        response = await destinationsAPI.update(id, processedData);
      } else {
        console.log("➕ Calling create API...");
        response = await destinationsAPI.create(processedData);
      }

      console.log("📡 API response received:", response);

      if (response && (response.success || response.data)) {
        console.log("✅ Success! Navigation starting...");
        navigate("/destinations");
      } else {
        const errorMsg =
          response?.error || response?.message || "Unknown error occurred";
        console.error("❌ API returned error:", errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error("❌ Submission error:", err);

      // Extract error message
      let errorMessage = "Failed to save destination";

      if (err.response?.data) {
        const data = err.response.data;
        if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.details) {
          errorMessage = `${data.error || "Error"}: ${data.details}`;
        }

        // Handle validation details
        if (data.details && typeof data.details === "object") {
          const validationErrors = Object.entries(data.details)
            .filter(([key, value]) => value)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ");
          if (validationErrors) {
            errorMessage += ` (${validationErrors})`;
          }
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link
            to="/destinations"
            className="text-indigo-600 hover:text-indigo-800 mr-4 flex items-center"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Destinations
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isEdit ? "Edit Destination" : "Create New Destination"}
        </h1>
        <p className="text-gray-600">
          {isEdit
            ? "Update the destination information below"
            : "Add a new travel destination to your catalog"}
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg
              className="w-5 h-5 text-red-400 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-red-700 whitespace-pre-line">{error}</div>
          </div>
        </div>
      )}

      {/* Debug Info - Remove in production
      {process.env.NODE_ENV === "development" && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">
            Debug Info:
          </h3>
          <div className="text-xs text-yellow-700 space-y-1">
            <div>Form attractions length: {form.attractions?.length || 0}</div>
            <div>Form localTips length: {form.localTips?.length || 0}</div>
            <div>Form salesPoints length: {form.salesPoints?.length || 0}</div>
            <div>Is Edit Mode: {isEdit ? "Yes" : "No"}</div>
            <div>ID: {id || "N/A"}</div>
          </div>
        </div>
      )} */}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                placeholder="e.g., Tokyo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <input
                type="text"
                name="country"
                value={form.country}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                placeholder="e.g., Japan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Region
              </label>
              <select
                name="region"
                value={form.region}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select Region</option>
                <option value="Asia">Asia</option>
                <option value="Europe">Europe</option>
                <option value="North America">North America</option>
                <option value="South America">South America</option>
                <option value="Africa">Africa</option>
                <option value="Oceania">Oceania</option>
                <option value="Antarctica">Antarctica</option>
                <option value="Southeast Asia">Southeast Asia</option>
                <option value="East Asia">East Asia</option>
                <option value="South Asia">South Asia</option>
                <option value="Central Asia">Central Asia</option>
                <option value="Western Europe">Western Europe</option>
                <option value="Eastern Europe">Eastern Europe</option>
                <option value="Northern Europe">Northern Europe</option>
                <option value="Southern Europe">Southern Europe</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Best Time to Visit
              </label>
              <input
                type="text"
                name="bestTimeToVisit"
                value={form.bestTimeToVisit}
                onChange={handleChange}
                placeholder="e.g., March-May, Sept-Nov"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <input
                type="text"
                name="currency"
                value={form.currency}
                onChange={handleChange}
                placeholder="e.g., Japanese Yen (¥)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <input
                type="text"
                name="language"
                value={form.language}
                onChange={handleChange}
                placeholder="e.g., Japanese"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Zone
              </label>
              <input
                type="text"
                name="timeZone"
                value={form.timeZone}
                onChange={handleChange}
                placeholder="e.g., JST (UTC+9)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Overview
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destination Overview
            </label>
            <textarea
              name="overview"
              value={form.overview}
              onChange={handleChange}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Provide a comprehensive overview of the destination..."
            />
            <div className="text-xs text-gray-500 mt-1">
              Describe the destination's highlights, culture, and what makes it
              special.
            </div>
          </div>
        </div>

        {/* Travel Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Travel Information
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visa Rules & Requirements
            </label>
            <textarea
              name="visaRules"
              value={form.visaRules}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Describe visa requirements, entry restrictions, and travel documentation needed..."
            />
          </div>
        </div>

        {/* Climate Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
              />
            </svg>
            Climate Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <span className="inline-block w-3 h-3 bg-green-400 rounded mr-2"></span>
                Spring Climate
              </label>
              <textarea
                name="climate.spring"
                value={form.climate.spring}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Describe spring weather conditions..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <span className="inline-block w-3 h-3 bg-yellow-400 rounded mr-2"></span>
                Summer Climate
              </label>
              <textarea
                name="climate.summer"
                value={form.climate.summer}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Describe summer weather conditions..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <span className="inline-block w-3 h-3 bg-orange-400 rounded mr-2"></span>
                Autumn Climate
              </label>
              <textarea
                name="climate.autumn"
                value={form.climate.autumn}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Describe autumn weather conditions..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <span className="inline-block w-3 h-3 bg-blue-400 rounded mr-2"></span>
                Winter Climate
              </label>
              <textarea
                name="climate.winter"
                value={form.climate.winter}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Describe winter weather conditions..."
              />
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            Content Sections
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Top Attractions
                <span className="text-xs text-gray-500 block mt-1">
                  Enter one attraction per line
                </span>
              </label>
              <textarea
                name="attractions"
                value={form.attractions}
                onChange={handleChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                placeholder="Tokyo Tower&#10;Senso-ji Temple&#10;Shibuya Crossing&#10;Meiji Shrine&#10;Tsukiji Outer Market"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Local Tips & Etiquette
                <span className="text-xs text-gray-500 block mt-1">
                  Enter one tip per line
                </span>
              </label>
              <textarea
                name="localTips"
                value={form.localTips}
                onChange={handleChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                placeholder="Bow when greeting people&#10;Remove shoes when entering homes&#10;Don't tip at restaurants&#10;Stand on the left side of escalators&#10;Keep voices low on public transport"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Selling Points
                <span className="text-xs text-gray-500 block mt-1">
                  Enter one selling point per line
                </span>
              </label>
              <textarea
                name="salesPoints"
                value={form.salesPoints}
                onChange={handleChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                placeholder="Rich cultural heritage and modern innovation&#10;World-class cuisine and dining experiences&#10;Efficient public transportation system&#10;Safe and clean environment&#10;Unique blend of traditional and contemporary attractions"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-lg">
          <Link
            to="/destinations"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium inline-flex items-center"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium inline-flex items-center"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin w-4 h-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {isEdit ? "Update Destination" : "Create Destination"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DestinationForm;
