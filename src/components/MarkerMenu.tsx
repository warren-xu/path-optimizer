import React, {useState, useRef, useEffect} from "react";
import { Autocomplete, LoadScript, Libraries } from "@react-google-maps/api";
import axios from "axios";

const libraries: Libraries = ['places'];
type MarkerMenuProps = {
    fetchMarkers: () => void;
    optimizeWaypoints: (markers: any[]) => Promise<any>;
  }

const MarkerMenu: React.FC<MarkerMenuProps> = ({ fetchMarkers, optimizeWaypoints,}) => {
    const [address, setAddress] = useState("");
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const [apiKey, setApiKey] = useState('');
    // Fetch API key and initial markers on component load
  useEffect(() => {
    const fetchApiKeyAndMarkers = async () => {
      try {
        const apiKeyResponse = await axios.get("http://127.0.0.1:3000/get_google_maps_key");
        setApiKey(apiKeyResponse.data.key);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchApiKeyAndMarkers();
  }, []);
  // Triggered when the user selects a suggestion from the autocomplete
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

      setAddress(""); // Clear the input field

      try {
        // Add the marker to the backend
        await axios.post("http://127.0.0.1:3000/add_marker", {
          address: selectedAddress,
          lat,
          lng,
        });

        console.log("Marker added successfully!");

        // Fetch the updated markers
        fetchMarkers();

        // Optimize the waypoints if there are more than one
        const response = await axios.get("http://127.0.0.1:3000/get_markers");
        const updatedMarkers = response.data;
        if (updatedMarkers.length > 1) {
          await optimizeWaypoints(updatedMarkers);
          console.log("Updated route");
        }
      } catch (error) {
        console.error("Error adding marker:", error);
      }
    }
  };

  const addMarker = async () => {
    if (!address.trim()) {
      console.error("Address cannot be empty");
      return;
    }
    try {
      await axios.post("http://127.0.0.1:3000/add_marker", {
        address,
      });
      console.log("Marker added successfully!");
      fetchMarkers();

      const response = await axios.get("http://127.0.0.1:3000/get_markers");
      const updatedMarkers = response.data;

      if (updatedMarkers.length > 1) {
        const optimizedData = await optimizeWaypoints(updatedMarkers);
        console.log("Updated route");
        // If optimization fails due to an unreachable location
        if (!optimizedData) {
          alert(`Unable to create a route that includes "${address}". It may be too far.`);
          console.warn("Removing unreachable marker:", address);

          // Remove the invalid marker
          await axios.post("http://127.0.0.1:3000/delete_marker", { address });

          // Fetch updated markers
          fetchMarkers();
        } else {
          console.log("Route optimized successfully.");
        }
      }

      // Clear the input after adding the marker
      setAddress("");
    } catch (error) {
      console.error("Error adding marker:", error);
    }
  };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
        <h1>Marker Management</h1>
        <div style={{ marginBottom: '20px' }}>
          <h2>Add a Marker</h2>
          {apiKey && (<LoadScript googleMapsApiKey={apiKey} libraries={libraries}>
          <Autocomplete onLoad={(autocompleteInstance) => setAutocomplete(autocompleteInstance)} onPlaceChanged={handlePlaceChanged}>
          <input
            type="text"
            placeholder="Enter address"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault(); // Prevent form submission
                addMarker(); // Add marker when pressing Enter
              }
            }}
            style={{
              padding: "10px",
              width: "500px",
              borderRadius: "5px",
              border: "1px solid #ccc",
            }}
          />
        </Autocomplete>
        </LoadScript>)}
        </div>
  
      </div>
    );
  };

export default MarkerMenu;