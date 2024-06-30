class SheetAccessor{
    constructor(sheet_id, sheet_name){
        this.sheet_id = sheet_id;
        this.sheet_name = sheet_name;
    }

    getFilteredDataWithDynamicQuery(filterFunction, filter_args) {
        // Open the spreadsheet by ID
        var spreadsheet = SpreadsheetApp.openById(this.sheet_id);
        
        // Get the specific sheet by name
        var sheet = spreadsheet.getSheetByName(this.sheet_name);
        
          // Get the range of data (you can adjust the range as needed)
        var dataRange = sheet.getDataRange();
        
        // Get the values from the range
        var data = dataRange.getValues();
        var dataWithoutHeader = data.slice(1);
        if (filter_args){
            // Apply the custom filter function
            var filteredData = dataWithoutHeader.filter(function(row) {
                return filterFunction(row, filter_args);
              });
        }else{
            var filteredData = dataWithoutHeader.filter(function(row) {
                return filterFunction(row);
              });
        }
        // Log the filtered data to the console (for debugging purposes)
        Logger.log(filteredData);
        
        // Return the filtered data
        return filteredData;
    }
    appendRow(new_row){
        // Open the spreadsheet by ID
        var spreadsheet = SpreadsheetApp.openById(this.sheet_id);
        // Get the specific sheet by name
        var sheet = spreadsheet.getSheetByName(this.sheet_name);
        // Append the new row
        sheet.appendRow(new_row);
    }
    setData(row, col, value){
        // Open the spreadsheet by ID
        var spreadsheet = SpreadsheetApp.openById(this.sheet_id);
        // Get the specific sheet by name
        var sheet = spreadsheet.getSheetByName(this.sheet_name);
        var cellRange = sheet.getRange(row, col);
        cellRange.setValue(value);
        return;
    }
    getLastRow(){
        // Open the spreadsheet by ID
        var spreadsheet = SpreadsheetApp.openById(this.sheet_id);
        
        // Get the specific sheet by name
        var sheet = spreadsheet.getSheetByName(this.sheet_name);
        return sheet.getLastRow();
    }
};
