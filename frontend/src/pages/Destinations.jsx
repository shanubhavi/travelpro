import React, { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Calendar,
  Globe,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Eye,
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { destinationsAPI } from "../services/api";

const Destinations = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [serverStatus, setServerStatus] = useState("checking");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8); // Show 9 items per page (3x3 grid)

  const navigate = useNavigate();

  // Load destinations on component mount
  useEffect(() => {
    loadDestinations();
  }, []);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const loadDestinations = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("Loading destinations...");

      const response = await destinationsAPI.getAll();
      console.log("Full API Response:", response);

      // Handle different response structures
      let data = [];
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (
          response.data.destinations &&
          Array.isArray(response.data.destinations)
        ) {
          data = response.data.destinations;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          data = response.data.data;
        } else {
          console.warn("Unexpected response structure:", response.data);
          data = [];
        }
      }

      console.log("Final processed data:", data);
      setDestinations(data);
      setServerStatus("online");
    } catch (err) {
      console.error("Error loading destinations:", err);
      setError(`Failed to load destinations: ${err.message}`);
      setServerStatus("offline");
      setDestinations([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter destinations based on search term
  const filteredDestinations = React.useMemo(() => {
    if (!destinations || !Array.isArray(destinations)) {
      return [];
    }

    if (!searchTerm || searchTerm.trim() === "") {
      return destinations;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    return destinations.filter((dest) => {
      if (!dest || typeof dest !== "object") {
        return false;
      }

      const name = String(dest.name || "").toLowerCase();
      const country = String(dest.country || "").toLowerCase();
      const region = String(dest.region || "").toLowerCase();

      return (
        name.includes(searchLower) ||
        country.includes(searchLower) ||
        region.includes(searchLower)
      );
    });
  }, [destinations, searchTerm]);

  // Pagination calculations
  const totalItems = filteredDestinations.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDestinations = filteredDestinations.slice(startIndex, endIndex);

  // Pagination functions
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const handleDelete = async (destination) => {
    if (
      window.confirm(`Are you sure you want to delete "${destination.name}"?`)
    ) {
      try {
        await destinationsAPI.delete(destination.id);
        await loadDestinations(); // Reload the list

        // Adjust current page if necessary
        const newTotalItems = filteredDestinations.length - 1;
        const newTotalPages = Math.ceil(newTotalItems / itemsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        }

        console.log(`Deleted destination: ${destination.name}`);
      } catch (err) {
        console.error("Error deleting destination:", err);
        alert("Failed to delete destination: " + err.message);
      }
    }
  };

  const getServerStatusDisplay = () => {
    switch (serverStatus) {
      case "online":
        return (
          <div className="flex items-center text-green-600 text-sm">
            <Wifi className="h-4 w-4 mr-1" />
            Server Online
          </div>
        );
      case "offline":
        return (
          <div className="flex items-center text-orange-600 text-sm">
            <WifiOff className="h-4 w-4 mr-1" />
            Offline Mode
          </div>
        );
      default:
        return (
          <div className="flex items-center text-gray-600 text-sm">
            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full mr-2"></div>
            Checking...
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div key={i} className="h-56 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Destinations
          </h1>
          <div className="flex items-center space-x-4">
            <p className="text-gray-600">
              Manage travel destination information and guides
            </p>
            {getServerStatusDisplay()}
          </div>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/destinations/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Destination
          </Link>
        </div>
      </div>

      {/* Server Status Banner */}
      {serverStatus === "offline" && (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <WifiOff className="h-5 w-5 text-orange-600 mr-3" />
            <div>
              <h3 className="text-orange-800 font-medium">
                Working in Offline Mode
              </h3>
              <p className="text-orange-700 text-sm">
                Server is currently unavailable. Your changes are being saved
                locally and will sync when the server is back online.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search destinations by name, country, or region..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-indigo-600">
            {destinations.length}
          </div>
          <div className="text-sm text-gray-600">Total Destinations</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">
            {destinations.length > 0
              ? new Set(destinations.map((d) => d.region).filter(Boolean)).size
              : 0}
          </div>
          <div className="text-sm text-gray-600">Regions Covered</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">
            {destinations.length > 0
              ? new Set(destinations.map((d) => d.country).filter(Boolean)).size
              : 0}
          </div>
          <div className="text-sm text-gray-600">Countries</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-purple-600">
            {filteredDestinations.length}
          </div>
          <div className="text-sm text-gray-600">
            {searchTerm ? "Search Results" : "Total Results"}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {/* Results Summary & Pagination Info */}
      {filteredDestinations.length > 0 && (
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of{" "}
            {totalItems} destinations
            {searchTerm && ` for "${searchTerm}"`}
          </div>
          {totalPages > 1 && (
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>
      )}

      {/* Destinations Grid */}
      {filteredDestinations.length === 0 && destinations.length > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-medium">No destinations found</h3>
          <p className="text-yellow-700 text-sm">
            No destinations match your search "{searchTerm}".
          </p>
          <button
            onClick={() => setSearchTerm("")}
            className="mt-2 text-yellow-800 underline text-sm"
          >
            Clear Search
          </button>
        </div>
      )}

      {filteredDestinations.length === 0 && destinations.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No destinations yet
          </h3>
          <p className="text-gray-600 mb-4">
            Get started by adding your first destination
          </p>
          <Link
            to="/destinations/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Destination
          </Link>
        </div>
      )}

      {currentDestinations.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {currentDestinations.map((destination) => (
              <div key={destination.id} className="group block">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-lg transition-all duration-300 transform group-hover:-translate-y-1">
                  <div className="relative h-32 mb-3 overflow-hidden rounded-lg">
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                      <MapPin className="h-10 w-10 text-white opacity-50" />
                    </div>
                    <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                      {destination.region || "N/A"}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {destination.name || "Unnamed Destination"}
                  </h3>
                  <div className="flex items-center text-gray-500 text-sm mb-2">
                    <Globe className="h-3 w-3 mr-1" />
                    <span className="truncate">
                      {destination.country || "Unknown Country"}
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs mb-3 line-clamp-2 leading-relaxed">
                    {destination.overview || "No description available"}
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span className="truncate">
                        {destination.bestTimeToVisit || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                      <Link
                        to={`/destinations/${destination.id}/edit`}
                        className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(destination)}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                    <Link
                      to={`/destinations/${destination.id}`}
                      className="ml-1"
                    >
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">{startIndex + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(endIndex, totalItems)}
                    </span>{" "}
                    of <span className="font-medium">{totalItems}</span> results
                  </p>
                </div>
                <div>
                  <nav
                    className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                    aria-label="Pagination"
                  >
                    {/* First Page Button */}
                    <button
                      onClick={goToFirstPage}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronsLeft className="h-5 w-5" />
                    </button>

                    {/* Previous Page Button */}
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    {/* Page Numbers */}
                    {getPageNumbers().map((pageNumber) => (
                      <button
                        key={pageNumber}
                        onClick={() => goToPage(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                          pageNumber === currentPage
                            ? "z-10 bg-indigo-600 text-white focus:bg-indigo-700"
                            : "text-gray-900"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}

                    {/* Next Page Button */}
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    {/* Last Page Button */}
                    <button
                      onClick={goToLastPage}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronsRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Destinations;
