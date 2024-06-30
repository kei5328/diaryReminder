

class CarReserveHandler{
    constructor(){
        this.pm = new PropertyManager();
        this.sheet_accessor = new SheetAccessor(this.pm.car_reserve_sheet_id, this.pm.car_reserve_sheet_name);
    }
    parseRow(row){
        const map = new Map();
        map.set("id", row[0]);
        map.set("datetime", row[1]);
        map.set("user_id", row[2]);
        map.set("reserve_date_int", row[3]);
        map.set("active", row[4]);
        return map;
    }
    generateNewRow(id, user_id, reserve_date_int, active){
        var curr_date = new Date();
        curr_date = TimeZoneManager.convertTZ(curr_date,PropertiesService.getScriptProperties().getProperty("TZ"));
        const row = [id, curr_date.getTime(), user_id, reserve_date_int, active];
        return row;
    }
    getReservationFromDate(date_int){
        var filter_func = function(row, date_int){
            return (row[3] == date_int);
        };
        const reservation = this.sheet_accessor.getFilteredDataWithDynamicQuery(filter_func, date_int);
        return reservation;
    }
    getReservationFromId(id){
        var filter_func = function(row, id){
            return (row[0] == id);
        };
        const reservation = this.sheet_accessor.getFilteredDataWithDynamicQuery(filter_func, id);
        if (reservation.length == 0){
            return "Doesn't have such reservation.";
        }else if(reservation.length == 1){
            return this.parseRow(reservation[0]);
        }else{
            // Should't get here
            return "Error";
        }
    }
    /**
     * This method adds a new reservation. 
     * @param {date_time} date 
     */
    addNew(date_int, user_id){
        var filter_func = function(row, date_int){
            return (row[3] == date_int);
        };
        const duplicate = this.sheet_accessor.getFilteredDataWithDynamicQuery(filter_func, date_int);
        if (duplicate.length == 0){
            // No existing ones.
            const last_row = this.sheet_accessor.getLastRow();
            // Shift two for header and 1 starting index.
            const new_row = this.generateNewRow(last_row-1, user_id, date_int, true);
            this.sheet_accessor.appendRow(new_row);
            return "Success";
        }else if(duplicate.length == 1){
            const map = this.parseRow(duplicate[0]);
            if (map.get("active") == false){
                if (map.get("user_id") == user_id){
                    // Set the 5th column active. 
                    this.sheet_accessor.setData(map.get("id")+2, 5, true);
                }else{
                    this.sheet_accessor.setData(map.get("id")+2, 3, user_id);
                    this.sheet_accessor.setData(map.get("id")+2, 5, true);
                }
                return "Success";
            }else{
                if (map.get("user_id") == user_id){
                    return "already Exists.";
                }else{
                    return "this date is already taken.";
                }
            }
        }else{
            // Shouldn't get here
            return "error"; 
        }
    }
    /**
     * This method gets all existing reservations, including the past ones.
     */
    getAllExisting(){
        var filter_func = function(row){
            return true;
        };
        const all = this.sheet_accessor.getFilteredDataWithDynamicQuery(filter_func);
        return all;
    }
    /**
     * This method gets all upcoming(including today) reservations.
     */
    getUpcoming(){
        var filter_func = function(row){
            var date = new Date();
            date = TimeZoneManager.convertTZ(date,PropertiesService.getScriptProperties().getProperty("TZ"));
            const date_int = getDateInt(date);
            return (row[3] >= date_int && row[4] == true);
        }
        const upcoming = this.sheet_accessor.getFilteredDataWithDynamicQuery(filter_func);
        Logger.log(upcoming);
        return upcoming;
    }
    /**
     * This method gets all upcoming(including today) reservations.
     */
    getUserUpcoming(user_id){
        var filter_func = function(row){
        var date = new Date();
        date = TimeZoneManager.convertTZ(date,PropertiesService.getScriptProperties().getProperty("TZ"));
        const date_int = getDateInt(date);
            return (row[3] >= date_int && row[4] == true && row[2] == user_id);
        }
        const upcoming = this.sheet_accessor.getFilteredDataWithDynamicQuery(filter_func, user_id);
        Logger.log(upcoming);
        return upcoming;
    }

    /**
     * This method removes an existing reservation. 
     * @param {int} id : reservation id
     */
    cancelExisting(id, user_id){
        var args = {
            "id": id,
            "user_id": user_id
        }
        var filter_func = function(row, args){
            var date = new Date();
            date = TimeZoneManager.convertTZ(date,PropertiesService.getScriptProperties().getProperty("TZ"));
            const date_int = getDateInt(date);
            return (row[0] == args.id && row[2] == args.user_id && row[3] >= date_int);
        }
        const upcoming = this.sheet_accessor.getFilteredDataWithDynamicQuery(filter_func, args);
        if (upcoming.length == 0){
            return "No existing reservation on this date.";
        }else if (upcoming.length == 1){
            const map = this.parseRow(upcoming[0]);
            if (map.get("user_id") == user_id){
                // Set the 5th column active. 
                this.sheet_accessor.setData(map.get("id")+2, 5, false);
                return "Success"; 
            }
        }else{
            // Shouldn't get here.
            return "Error";
        }
    }
};