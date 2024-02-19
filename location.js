
/**
 * The class to handle the location information of the user. 
 */
class Location{
  constructor(lat, lon)
  {
      this.lat = lat;
      this.lon = lon;
      this.tz = this.getTz();
      this._getApiKey()
  }
  _getApiKey(){
    this.MY_GOOGLE_KEY = PropertiesService.getScriptProperties().getProperty("GOOGLE_MAP_API_KEY");
  }
  getDistMatTwoPoints(dest_lat, dest_lon, origin_lat, origin_lon)
  {
    let dist_dict = {"dist": -1.0, "duration_in_traffic": -1.0};
    const hex_comma = "%2C";
    let url = "https://maps.googleapis.com/maps/api/distancematrix/json";
    url = url + "?destinations=" + dest_lat + hex_comma + dest_lon;
    url = url + "&origins=" + origin_lat + hex_comma + origin_lon;
    url = url + "&departure_time=now";
    url = url + "&key=" + this.MY_GOOGLE_KEY;
    const res_raw = UrlFetchApp.fetch(url);
    let res = JSON.parse(res_raw);
    Logger.log(res)
    if (res && res.status == "OK"){
      let dist = res.rows[0].elements[0].distance.value;
      let dur_in_traffic = res.rows[0].elements[0].duration_in_traffic.value;
      dist_dict['dist'] = dist;
      dist_dict['duration_in_traffic'] = dur_in_traffic;
    }
    else{
      return dist_dict;
    }
    return dist_dict;
  }
  getTz(){
      let url = "https://maps.googleapis.com/maps/api/timezone/json?location=" + this.lat +"%2C" + this.lon + "&timestamp=1331161200&key=" + this.GOOGLE_MAP_API_KEY;
      try
      {
        let res = UrlFetchApp.fetch(url);
        Logger.log(res);
        res = JSON.parse(res);
        return res.timeZoneId;
      }
      catch (err)
      {
        Logger.log(err);
        return "-1";
      }
  }
  getDistMatToDest(dest_location){
      return this.getDistMatTwoPoints(dest_location.lat, dest_location.lon, this.lat, this.lon);
  }
}

function test_location()
{
test_dest_lat = 40.659569;
test_dest_long = -73.933783;

test_orig_lat = 40.6655101;
test_orig_long = -73.89188969999998;

let my_loc = new Location(test_orig_lat, test_orig_long);
let dest_loc = new Location(test_dest_lat, test_dest_long);
Logger.log(my_loc.getTz());
Logger.log(my_loc.getTz());

dist_mat = my_loc.getDistMatToDest(dest_loc);
Logger.log(dist_mat.dist);
Logger.log(dist_mat.duration_in_traffic);
}
