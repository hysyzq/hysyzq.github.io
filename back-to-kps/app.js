var map = L.map('map').setView([51.505, -0.09], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var houses = [
    { lat: 51.505, lng: -0.09, id: 1 },
    { lat: 51.515, lng: -0.1, id: 2 }
];

houses.forEach(function(house) {
    L.marker([house.lat, house.lng]).addTo(map)
        .on('click', function() {
            openPanelWithHouseData(house.id);
        });
});

function openPanelWithHouseData(houseId) {
    console.log("Open form for house: " + houseId);
    // Additional form handling logic goes here
}
