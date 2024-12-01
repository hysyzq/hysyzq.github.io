
let summary = {
    totalHouses: 0,
    totalResponses: 0,
    responsedHouses: 0,
    noResponses: 0,
    supportLevels: { 1: 0, 2: 0, 3: 0, 4: 0 }
};

async function initMap() {
    var communityCenter = { lat: -33.706276551341325,   lng: 150.94656745195007 }; // Your community coordinates
    var map = new google.maps.Map(document.getElementById("map"), {
        zoom: 17, // Higher zoom level for better building details
        center: communityCenter,
        mapId: '7b8e1c8edc768e27',
        mapTypeId: 'roadmap' // 'roadmap', 'satellite', 'hybrid', etc.
    });

    try {
        const houses = await fetchHouseDataFromGoogleSheets();
        const responses = await fetchFormResponseDataFromGoogleSheets();
        const volunteerData = await fetchVolunteerFrom();

        summary.totalHouses = houses.length;
        summary.totalResponses = responses.length;

        responses.forEach(function(response) {
            const matchingHouse = houses.find(house =>
                house.street_number === response.street_number &&
                house.street_name === response.street_name
            );
            
            if (matchingHouse) {

                const adjustedLongitude = parseFloat(matchingHouse.longitude) + (matchingHouse.picked * 0.00002);

                const marker = new google.maps.marker.AdvancedMarkerElement({
                    position: { lat: parseFloat(matchingHouse.latitude), lng: adjustedLongitude },
                    map: map,
                    title: `${matchingHouse.street_number} ${matchingHouse.street_name}`,
                    content: createMarkerContent(response)
                });

                marker.addListener('click', function() {
                    openPanelWithResponseData(response);
                });
                summary.supportLevels[response.support_level]++;
                matchingHouse.picked += 1;
            }
        });

        houses.forEach(function(house) {
            if (!house.picked) {

                const volunteerMatches = volunteerData.filter(volunteer =>
                    volunteer.street_number === house.street_number &&
                    volunteer.street_name === house.street_name
                );
        
                // Get the latest volunteer data based on the timestamp
                const latestVolunteer = volunteerMatches.sort((a, b) =>
                    new Date(b.timestamp) - new Date(a.timestamp)
                )[0];

                let strokeColor = '#dda15e'; // Default stroke color for unmatched houses
                let fillColor = '#fefae0';   // Default fill color for unmatched houses
                let radius = 7;
        
                if (latestVolunteer) {
                    // Update circle color based on support level from volunteer data
                    switch (parseInt(latestVolunteer.support_level)) {
                        case 5:// Volunteer
                            strokeColor = '#52b788'; // Green stroke
                            fillColor = '#d8f3dc';   // Light green fill
                            radius = 8;
                            break;
                        case 4: 
                        case 3: // Supporter
                            strokeColor = '#00b4d8'; // Blue stroke
                            fillColor = '#caf0f8';   // Light blue fill
                            radius = 8;
                            break;
                        case 2: // Interested but undecided
                            strokeColor = '#e63946'; // Red stroke
                            fillColor = '#ffccd5';   // Light red fill
                            break;
                        case 1: // Don't support
                            strokeColor = '#495057'; // Grey stroke
                            fillColor = '#ced4da';   // Light grey fill
                            radius = 5;
                            break;
                        default:
                            // Keep the default colors
                            break;
                    }
                }

                const circle = new google.maps.Circle({
                    strokeColor: strokeColor,
                    strokeOpacity: 0.8,
                    strokeWeight: 1, 
                    fillColor: fillColor,
                    fillOpacity: 0.6, 
                    map: map, 
                    center: {
                        lat: parseFloat(house.latitude),
                        lng: parseFloat(house.longitude)
                    }, 
                    radius: radius, 
                });
        
                // Add a click listener for the circle
                google.maps.event.addListener(circle, 'click', function() {
                    if (latestVolunteer) {
                        openPanelWithVolunteerData(latestVolunteer); // Show the latest volunteer data
                    } else {
                        openGoogleForm(house); // Open form for unmatched houses
                    }
                });
                summary.noResponses ++;
            }
        });
        summary.responsedHouses = summary.totalHouses - summary.noResponses;
        updateSummaryUI(summary);

    } catch (error) {
        console.error("Error fetching house data:", error);
    }
}

function updateSummaryUI(summary) {
    document.getElementById('totalHouses').textContent = summary.totalHouses;
    document.getElementById('totalResponses').textContent = summary.totalResponses;
    document.getElementById('responsedHouses').textContent = summary.responsedHouses;
    document.getElementById('noResponses').textContent = summary.noResponses;

    // Update support level counts
    document.getElementById('supportLevel1').textContent = summary.supportLevels[1];
    document.getElementById('supportLevel2').textContent = summary.supportLevels[2];
    document.getElementById('supportLevel3').textContent = summary.supportLevels[3];
    document.getElementById('supportLevel4').textContent = summary.supportLevels[4];
}

function createMarkerContent(response) {
    let pinColor;
    let borderColor;
    let scale;
    switch (response.support_level) {
        case 4:
            pinColor = '#52b788'; // Green
            borderColor = '#081c15';
            scale = 1.0;
            break;
        case 3:
            pinColor = '#00b4d8'; // Blue
            borderColor = '#0077b6';
            scale = 1.0;
            break;
        case 2:
            pinColor = '#e63946'; // Red
            borderColor = '#9d0208';
            scale = 1.0;
            break;
        case 1:
            pinColor = '#495057'; // Grey
            borderColor = '#343a40';
            scale = 0.7;
            break;
        default:
            pinColor = '#fefae0'; // Default
            borderColor = '#dda15e';
            scale = 0.7;
    }
    const glyph = response.preferred_name?.charAt(0).toUpperCase() || "";
    const pinBackground = new google.maps.marker.PinElement({
        scale: scale,
        background: pinColor,
        borderColor: borderColor,
        glyph: glyph,
        glyphColor: "white",
      });
    return pinBackground.element;
}

async function fetchHouseDataFromGoogleSheets() {
    const spreadsheetId = '1EH5D_qMGHkv_OujOnUzluPRJ9QStMe1ZPaFQroZvCsc';
    const apiKey = 'AIzaSyDB_wY6Ucs22RYTlnnHCvg8CFMj2M6WUss'; 
    const range = 'houses!A:E';

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch Google Sheets data');
    }
    const data = await response.json();
    
    // Transform the data from the Google Sheet to the required format
    const rows = data.values;
    const houses = [];
    
    // Assuming the first row is headers, start from the second row
    for (let i = 1; i < rows.length; i++) {
        const [id, latitude, longitude,street_number,street_name, status] = rows[i];
        houses.push({
            id: id,
            latitude: latitude,
            longitude: longitude,
            street_number: street_number,
            street_name: street_name,
            picked: 0,
        });
    }

    return houses;
}

async function fetchFormResponseDataFromGoogleSheets() {
    const spreadsheetId = '1EH5D_qMGHkv_OujOnUzluPRJ9QStMe1ZPaFQroZvCsc';
    const apiKey = 'AIzaSyDB_wY6Ucs22RYTlnnHCvg8CFMj2M6WUss'; 
    const range = 'MaskedData!A:K';

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch Google Sheets data');
    }
    const data = await response.json();
    
    // Transform the data from the Google Sheet to the required format
    const rows = data.values;
    const responses = [];
    
    // Assuming the first row is headers, start from the second row
    for (let i = 1; i < rows.length; i++) {
        const [timestamp, preferred_name, email, street_number, street_name, support_community, main_concerns,petition, phone_number, availability, comments] = rows[i];
        responses.push({
            timestamp: timestamp,
            preferred_name: preferred_name,
            email: email,
            street_number: street_number,
            street_name: street_name,
            support_community: support_community,
            main_concerns: main_concerns,
            petition: petition,
            phone_number: phone_number,
            availability: availability,
            comments: comments,
            support_level: getSupportLevel(support_community),
        });
    }

    return responses;
}

async function fetchVolunteerFrom() {
    const spreadsheetId = '1EH5D_qMGHkv_OujOnUzluPRJ9QStMe1ZPaFQroZvCsc';
    const apiKey = 'AIzaSyDB_wY6Ucs22RYTlnnHCvg8CFMj2M6WUss'; 
    const range = 'VolunteerForm!A:F';

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch Google Sheets data');
    }
    const data = await response.json();
    
    // Transform the data from the Google Sheet to the required format
    const rows = data.values;
    const volunteerData = [];
    
    // Assuming the first row is headers, start from the second row
    for (let i = 1; i < rows.length; i++) {
        const [timestamp, street_number, street_name, support_level, comments, volunteer] = rows[i];
        volunteerData.push({
            timestamp: timestamp,
            street_number: street_number,
            street_name: street_name,
            support_level: support_level,
            comments: comments,
            volunteer: volunteer,
        });
        console.log(rows[i]);
    }

    return volunteerData;
}

function getSupportLevel(support_community){
    switch (support_community) {
        case 'Yes, through volunteering.':
            return 4;
        case 'Yes, but I only want to participate in the most important meetings.':
            return 3;
        case 'I am interested, but I need more information.':
        case "Not sure if we should return back to KPS.":
            return 2
        case 'No, not at this time.':
        case "No, I don't want to return back to KPS.":
        case "No, I don't care at all.":
            return 1;
        default:
            return 0;
    }
}

function openPanelWithResponseData(response) {
    // Displaying form with the details of the clicked response
    const formPanel = document.getElementById('formPanel');
    formPanel.innerHTML = `
        <h3>Address: ${response.street_number} ${response.street_name}</h3>
        <p><strong>Preferred Name:</strong> ${response.preferred_name}</p>
        <p><strong>Email:</strong> ${response.email}</p>
        <p><strong>Support this campaign:</strong> ${response.support_community}</p>
        <p><strong>Main Concerns:</strong> ${response.main_concerns}</p>
        <p><strong>Petition signed:</strong> ${response.petition}</p>
        <p><strong>Phone number:</strong> ${response.phone_number ? response.phone_number : 'N/A'}</p>
        <p><strong>Availability:</strong> ${response.availability ? response.availability : 'N/A'}</p>
        <p><strong>Comments:</strong> ${response.comments ? response.comments : 'N/A'}</p>
        <button onclick="closePanel()">Close</button>
    `;
}

function openGoogleForm() {
    // Display Google Form link in the panel
    const formPanel = document.getElementById('formPanel');
    formPanel.innerHTML = `
        <h3>Submit Your Information</h3>
        <p>Please fill out the form to provide more information about your household.</p>
        <a href="https://forms.gle/6ocvUTV2GzJdDJJD6" target="_blank">Open Google Form</a>.
        <p>If you are a volunteer, use <a href="https://forms.gle/K4UAbJmMBJaTP8iQ8" target="_blank">Volunteer Form</a>.</p>
        <button onclick="closePanel()">Close</button>
    `;
}

function openPanelWithVolunteerData(volunteer) {
    const formPanel = document.getElementById('formPanel');
    formPanel.innerHTML = `
        <h3>Volunteer Information</h3>
        <p><strong>Address:</strong> ${volunteer.street_number} ${volunteer.street_name}</p>
        <p><strong>Support Level:</strong> ${volunteer.support_level}</p>
        <p><strong>Comments:</strong> ${volunteer.comments ? volunteer.comments : 'N/A'}</p>
        <p><strong>Volunteer's Name:</strong> ${volunteer.volunteer ? volunteer.volunteer : 'N/A'}</p>
        <p><strong>Last Updated:</strong> ${new Date(volunteer.timestamp).toLocaleString()}</p>
        <h3>Submit Your Information</h3>
        <p>Please fill out the form to provide more information about your household.</p>
        <a href="https://forms.gle/6ocvUTV2GzJdDJJD6" target="_blank">Open Google Form</a>.
        <p>If you are a volunteer, use <a href="https://forms.gle/K4UAbJmMBJaTP8iQ8" target="_blank">Volunteer Form</a>.</p>
        <button onclick="closePanel()">Close</button>
    `;
}

function closePanel() {
    const formPanel = document.getElementById('formPanel');
    formPanel.innerHTML = `
             <div id="summaryPanel">
                <h3>Summary</h3>
                <p>Total Responses: <span id="totalResponses">0</span></p>
                <p>Total Houses: <span id="totalHouses">0</span></p>
                <p>Responsed Houses <span id="responsedHouses">0</span></p>
                <p>No Responses: <span id="noResponses">0</span></p>
                <p>Support Levels:</p>
                <ul>
                    <li><span style="color: #52b788; font-weight: bold;">Green (Volunteers):</span> <span id="supportLevel4">0</span></li>
                    <li><span style="color: #00b4d8; font-weight: bold;">Blue (Supportor): </span><span id="supportLevel3">0</span></li>
                    <li><span style="color: #e63946; font-weight: bold;">Red (Aware): </span> <span id="supportLevel2">0</span></li>
                    <li><span style="color: #495057; font-weight: bold;">Gray (Don’t Support):</span><span id="supportLevel1">0</span></li>
                </ul>
            </div>
            <p>Click on a marker to see more details or submit your information via the <a href="https://forms.gle/6ocvUTV2GzJdDJJD6" target="_blank">Google Form</a>.</p>`;
    updateSummaryUI(summary);
}
