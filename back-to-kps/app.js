function initMap() {
    var communityCenter = { lat: -33.706276551341325,   lng: 150.94656745195007 }; // Your community coordinates
    var map = new google.maps.Map(document.getElementById("map"), {
        zoom: 17, // Higher zoom level for better building details
        center: communityCenter,
        mapTypeId: 'roadmap' // 'roadmap', 'satellite', 'hybrid', etc.
    });

    // Example markers for each house
    var houses = [
        { lat: 51.506, lng: -0.09, id: 1 },
        { lat: 51.507, lng: -0.091, id: 2 }
    ];

    houses.forEach(function(house) {
        var marker = new google.maps.Marker({
            position: { lat: house.lat, lng: house.lng },
            map: map,
            title: "House " + house.id
        });

        marker.addListener('click', function() {
            openPanelWithHouseData(house.id);
        });
    });
}

function openPanelWithHouseData(houseId) {
    // Displaying form with the details of the clicked house
    const formPanel = document.getElementById('formPanel');
    formPanel.innerHTML = `
        <h3>House ID: ${houseId}</h3>
        <form>
            <label for="checkbox1">Checkbox 1</label>
            <input type="checkbox" id="checkbox1">
            <br>
            <label for="input1">Input 1</label>
            <input type="text" id="input1">
            <br><br>
            <button type="submit">Submit</button>
        </form>
        <button onclick="closePanel()">Close</button>
    `;
}

function closePanel() {
    const formPanel = document.getElementById('formPanel');
    formPanel.innerHTML = '';
}
