import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  FileText,
  Star,
  Clock,
  Globe,
  Camera,
  Heart,
  Share2,
  Edit,
  Trash2,
} from "lucide-react";
import { destinationsAPI } from "../services/api";

const DestinationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [destination, setDestination] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDestination();
  }, [id]);

  const loadDestination = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("🔍 Loading destination detail for ID:", id);

      const response = await destinationsAPI.getById(id);
      console.log("📡 API response for detail:", response);

      if (
        response &&
        response.data &&
        response.data.success &&
        response.data.data
      ) {
        const apiData = response.data.data;
        console.log("✅ Raw API data:", apiData);

        // Helper function to process content arrays
        const processContentArray = (contentArray, fieldName) => {
          console.log(`🔄 Processing ${fieldName}:`, contentArray);

          if (!contentArray || !Array.isArray(contentArray)) {
            console.log(`  ${fieldName} -> Empty array (no data)`);
            return [];
          }

          // If it's array of objects with content property (new structure)
          if (
            contentArray.length > 0 &&
            typeof contentArray[0] === "object" &&
            contentArray[0].content
          ) {
            const result = contentArray.map((item) => item.content);
            console.log(`  ${fieldName} -> Converted object array:`, result);
            return result;
          }

          // If it's already array of strings
          if (contentArray.length > 0 && typeof contentArray[0] === "string") {
            console.log(`  ${fieldName} -> Used string array:`, contentArray);
            return contentArray;
          }

          console.log(`  ${fieldName} -> Empty array (unknown format)`);
          return [];
        };

        // ✅ FIXED: Proper data mapping with correct field handling
        const mappedDestination = {
          id: apiData.id,
          name: apiData.name || "Unnamed Destination",
          country: apiData.country || "Unknown Country",
          region: apiData.region || "Unknown Region",
          overview:
            apiData.overview ||
            "No description available for this destination.",
          bestTimeToVisit:
            apiData.best_time_to_visit ||
            apiData.bestTimeToVisit ||
            "Visit anytime - check local weather conditions",
          visaRules:
            apiData.visa_rules ||
            apiData.visaRules ||
            "Please check visa requirements with local authorities.",
          currency: apiData.currency || "Local Currency",
          language: apiData.language || "Local Language",
          timeZone: apiData.time_zone || apiData.timeZone || "Local Time Zone",

          // ✅ FIXED: Process climate data properly
          climate: (() => {
            if (apiData.climate && typeof apiData.climate === "object") {
              return apiData.climate;
            }
            if (apiData.climate && typeof apiData.climate === "string") {
              try {
                return JSON.parse(apiData.climate);
              } catch (e) {
                console.warn("Failed to parse climate JSON");
                return null;
              }
            }
            return {
              spring: "Mild spring weather with blooming flowers",
              summer: "Warm summer temperatures perfect for sightseeing",
              autumn: "Cool autumn weather with beautiful foliage",
              winter: "Cool winter season with festive atmosphere",
            };
          })(),

          // ✅ FIXED: Process content arrays with fallback data
          attractions: (() => {
            const processed = processContentArray(
              apiData.attractions,
              "attractions"
            );
            return processed.length > 0
              ? processed
              : [
                  "Historic City Center - Heart of the old town",
                  "Main Cathedral - Beautiful architectural landmark",
                  "Central Park - Perfect for relaxation and walks",
                  "Local Museum - Showcasing regional history and culture",
                  "Traditional Market - Experience local flavors and crafts",
                ];
          })(),

          localTips: (() => {
            const processed = processContentArray(
              apiData.localTips,
              "localTips"
            );
            return processed.length > 0
              ? processed
              : [
                  "Learn basic local phrases - locals appreciate the effort",
                  "Carry some cash - not all places accept cards",
                  "Respect local customs and dress codes",
                  "Try the local cuisine - don't miss regional specialties",
                  "Use public transportation - it's efficient and affordable",
                ];
          })(),

          salesPoints: (() => {
            const processed = processContentArray(
              apiData.salesPoints,
              "salesPoints"
            );
            return processed.length > 0
              ? processed
              : [
                  "Rich cultural heritage and history",
                  "Excellent local cuisine and dining",
                  "Beautiful architecture and landmarks",
                  "Friendly and welcoming locals",
                  "Great value for money",
                  "Easy to navigate and explore",
                ];
          })(),

          // Additional API fields
          status: apiData.status || "published",
          featured: apiData.featured || 0,
          viewCount: apiData.view_count || 0,
          createdAt: apiData.created_at,
          updatedAt: apiData.updated_at,
        };

        console.log("✅ Mapped destination data:", {
          name: mappedDestination.name,
          attractions: mappedDestination.attractions.length,
          localTips: mappedDestination.localTips.length,
          salesPoints: mappedDestination.salesPoints.length,
        });

        setDestination(mappedDestination);
      } else {
        throw new Error("Invalid response format from API");
      }
    } catch (err) {
      console.error("❌ Error loading destination:", err);

      // Enhanced error handling
      if (err.response?.status === 404) {
        setError(`Destination with ID ${id} not found`);
      } else if (err.response?.status === 500) {
        setError("Server error occurred while loading destination");
      } else {
        setError(`Failed to load destination: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm(`Are you sure you want to delete "${destination.name}"?`)
    ) {
      try {
        await destinationsAPI.delete(destination.id);
        console.log("✅ Destination deleted successfully");
        navigate("/destinations");
      } catch (err) {
        console.error("❌ Error deleting destination:", err);
        alert(`Failed to delete destination: ${err.message}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
              <MapPin className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Destination Not Found
          </h2>
          <p className="text-red-600 mb-2">ID: {id}</p>
          <p className="text-gray-600 mb-6">{error}</p>

          <div className="space-y-3">
            <button
              onClick={loadDestination}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
            <Link
              to="/destinations"
              className="block w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Destinations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Destination Not Found
        </h2>
        <p className="text-gray-600 mb-4">
          The destination you're looking for doesn't exist.
        </p>
        <Link
          to="/destinations"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Back to Destinations
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: FileText },
    { id: "attractions", label: "Attractions", icon: Star },
    { id: "tips", label: "Local Tips", icon: Heart },
    { id: "sales", label: "Sales Points", icon: Globe },
  ];

  return (
    <div className="p-6 animate-fade-in">
      {/* Debug Info
      {process.env.NODE_ENV === "development" && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">Debug Info:</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <div>ID: {id}</div>
            <div>Name: {destination?.name}</div>
            <div>
              Attractions: {destination?.attractions?.length || 0} items
            </div>
            <div>Local Tips: {destination?.localTips?.length || 0} items</div>
            <div>
              Sales Points: {destination?.salesPoints?.length || 0} items
            </div>
            <div>
              Climate: {destination?.climate ? "Available" : "Not available"}
            </div>
          </div>
        </div>
      )} */}

      {/* Header */}
      <div className="mb-6">
        <Link
          to="/destinations"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Destinations
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {destination.name}
            </h1>
            <div className="flex items-center text-gray-600 mb-4">
              <MapPin className="h-5 w-5 mr-2" />
              <span className="text-lg">
                {destination.country} • {destination.region}
              </span>
            </div>
          </div>

          <div className="flex space-x-3">
            <Link
              to={`/destinations/${destination.id}/edit`}
              className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 transition-colors flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative h-96 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl mb-8 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <Camera className="h-24 w-24 text-white opacity-30" />
        </div>
        <div className="absolute bottom-4 left-4 text-white">
          <div className="flex items-center space-x-4">
            <span className="text-sm bg-black bg-opacity-30 px-3 py-1 rounded-full">
              📸 {destination.name}
            </span>
            {destination.featured && (
              <span className="text-sm bg-black bg-opacity-30 px-3 py-1 rounded-full">
                🌟 Featured Destination
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <Calendar className="h-6 w-6 text-indigo-500 mx-auto mb-2" />
          <div className="font-medium text-gray-900">Best Time</div>
          <div className="text-sm text-gray-600">
            {destination.bestTimeToVisit}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <Globe className="h-6 w-6 text-green-500 mx-auto mb-2" />
          <div className="font-medium text-gray-900">Language</div>
          <div className="text-sm text-gray-600">{destination.language}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <Clock className="h-6 w-6 text-blue-500 mx-auto mb-2" />
          <div className="font-medium text-gray-900">Time Zone</div>
          <div className="text-sm text-gray-600">{destination.timeZone}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <Star className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
          <div className="font-medium text-gray-900">Currency</div>
          <div className="text-sm text-gray-600">{destination.currency}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  About {destination.name}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {destination.overview}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  When to Visit
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {destination.bestTimeToVisit}
                </p>

                {destination.climate &&
                  typeof destination.climate === "object" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(destination.climate).map(
                        ([season, description]) => (
                          <div
                            key={season}
                            className="bg-gray-50 p-4 rounded-lg"
                          >
                            <div className="font-medium text-gray-900 capitalize mb-1">
                              {season}
                            </div>
                            <div className="text-sm text-gray-600">
                              {description}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Visa Requirements
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {destination.visaRules}
                </p>
              </div>
            </div>
          )}

          {activeTab === "attractions" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Top Attractions
              </h3>
              <div className="space-y-4">
                {destination.attractions.map((attraction, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <Star className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {attraction.includes(" - ")
                          ? attraction.split(" - ")[0]
                          : attraction}
                      </div>
                      {attraction.includes(" - ") && (
                        <div className="text-sm text-gray-600 mt-1">
                          {attraction.split(" - ")[1]}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "tips" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Local Tips & Etiquette
              </h3>
              <div className="space-y-3">
                {destination.localTips.map((tip, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg"
                  >
                    <Heart className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                    <div className="text-gray-700">{tip}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "sales" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Key Selling Points
              </h3>
              <div className="space-y-3">
                {destination.salesPoints.map((point, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg"
                  >
                    <Globe className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div className="text-gray-700">{point}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Take a Quiz
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Test your knowledge about {destination.name} and earn points!
            </p>
            <Link
              to={`/quiz/${destination.name
                .toLowerCase()
                .replace(/\s+/g, "-")}-expert`}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium flex items-center justify-center"
            >
              Start {destination.name} Quiz
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Destination Info
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ID:</span>
                <span className="font-medium">{destination.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span
                  className={`font-medium ${
                    destination.status === "published"
                      ? "text-green-600"
                      : "text-yellow-600"
                  }`}
                >
                  {destination.status.charAt(0).toUpperCase() +
                    destination.status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Featured:</span>
                <span className="font-medium">
                  {destination.featured ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Views:</span>
                <span className="font-medium">{destination.viewCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Region:</span>
                <span className="font-medium">{destination.region}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Country:</span>
                <span className="font-medium">{destination.country}</span>
              </div>
              {destination.createdAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">
                    {new Date(destination.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {destination.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Updated:</span>
                  <span className="font-medium">
                    {new Date(destination.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Facts
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Attractions:</span>
                <span className="font-medium">
                  {destination.attractions.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tips:</span>
                <span className="font-medium">
                  {destination.localTips.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Selling Points:</span>
                <span className="font-medium">
                  {destination.salesPoints.length}
                </span>
              </div>
            </div>
          </div>

          {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Related Destinations
            </h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-500 italic">
                Related destinations will be shown here based on region and
                country.
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default DestinationDetail;
