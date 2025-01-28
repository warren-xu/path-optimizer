import React, { useState, useRef, useEffect } from "react";
import { Autocomplete, LoadScript, Libraries } from "@react-google-maps/api";
import axios from "axios";

const libraries: Libraries = ["places"];

type MarkerMenuProps = {
  fetchMarkers: () => void;
  optimizeWaypoints: (markers: any[]) => Promise<any>;
};

const BASE_API_URL = "https://backend-flask-5q4c.onrender.com";

const MarkerMenu: React.FC<MarkerMenuProps> = ({ fetchMarkers, optimizeWaypoints }) => {
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [apiKey, setApiKey] = useState("");
  const inputRef = useRef<HTMLInputElement>(null); // Ref to access the input field

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const apiKeyResponse = await axios.get(`${BASE_API_URL}/get_google_maps_key`);
        setApiKey(apiKeyResponse.data.key);
      } catch (error) {
        console.error("Error fetching API key:", error);
      }
    };
    fetchApiKey();
  }, []);

  const handlePlaceChanged = async () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (!place.geometry) {
        console.error("Selected place does not have geometry.");
        return;
      }

      const selectedAddress = place.formatted_address || "";
      const lat = place.geometry.location?.lat();
      const lng = place.geometry.location?.lng();

      if (!selectedAddress || lat === undefined || lng === undefined) {
        console.error("Incomplete place details.");
        return;
      }

      try {
        // Add the marker to the backend
        await axios.post(`${BASE_API_URL}/add_marker`, {
          address: selectedAddress,
          lat,
          lng,
        });

        console.log("Marker added successfully!");

        // Fetch the updated markers
        fetchMarkers();

        // Optimize the waypoints if there are more than one
        const response = await axios.get(`${BASE_API_URL}/get_markers`);
        const updatedMarkers = response.data;
        if (updatedMarkers.length > 1) {
          await optimizeWaypoints(updatedMarkers);
          console.log("Updated route");
        }
      } catch (error) {
        console.error("Error adding marker:", error);
      }

      // Clear the input field
      if (inputRef.current) {
        inputRef.current.value = ""; // Clear the input value directly
      }
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission
      if (autocomplete) {
        await handlePlaceChanged(); // Ensure place is processed when pressing Enter
      } else {
        console.error("Autocomplete instance is not initialized.");
      }
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "20px" }}>
      <h1>Marker Management</h1>
      <div style={{ marginBottom: "20px" }}>
        <h2>Add a Marker</h2>
        {apiKey && (
          <LoadScript googleMapsApiKey={apiKey} libraries={libraries}>
            <Autocomplete
              onLoad={(autocompleteInstance) => setAutocomplete(autocompleteInstance)}
              onPlaceChanged={handlePlaceChanged}
            >
              <input
                ref={inputRef} // Attach ref to the input field
                type="text"
                placeholder="Enter address"
                onKeyDown={handleKeyDown} // Trigger handleKeyDown for Enter key
                style={{
                  padding: "10px",
                  width: "500px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                }}
              />
            </Autocomplete>
          </LoadScript>
        )}
      </div>
    </div>
  );
};

export default MarkerMenu;
