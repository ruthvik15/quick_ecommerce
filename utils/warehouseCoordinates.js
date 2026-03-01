// These represent actual warehouse/supply locations instead of just city centers
// This allows more accurate distance calculations for deliverability
module.exports = {
  hyderabad: { 
    lat: 17.360389, 
    lng: 78.474019,
    name: "Hyderabad Warehouse - Gachibowli"
  },
  bengaluru: { 
    lat: 12.934701, 
    lng: 77.621417,
    name: "Bengaluru Warehouse - Whitefield"
  },
  mumbai: { 
    lat: 19.088537, 
    lng: 72.881088,
    name: "Mumbai Warehouse - Mundra"
  },
  delhi: { 
    lat: 28.489914, 
    lng: 77.064128,
    name: "Delhi Warehouse - Gurgaon"
  }
};
