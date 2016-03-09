/***********************************************************
 * Google script to rollover tasks from previous day.
 *
 * Major limitation is that this script estimated the Calendar's
 * time zone is EST ( -5:00 UTC )  Future versions will support
 * a more robust Calendar vs Server time solution.
 *
 * The script operates on the calendar name 'To Do'.  This must be
 * edited manually by settings the CALENDAR variable to another value.
 *
 * Once set up, the script adds 24 hours to each event
 * from the previous day to the next day between 12am and 1am in the
 * Calendar's timezone.
 *
 * The following includes a list of things necessary accomplish:
 *
 *      - Manipulate time based upon user's calendar timzeone
 *      - Compute time based upon server's timezone accurately
 *      - Create user interface within calendar for settings
 *      - Allow multiple calendars
 *      - Allow calendar to be selected by user
 *      - Allow custom time for rolling over items
 *      - Allow custom rollover distance
 *      - Implement further requests
 *
 * The following should be changed code-wise:
 *
 *      - Ensure namespace collisions not possible
 *      - Use strict mode if possible
 *      - Create object oriented format
 *      - Rename main function
 *      - Document code
 *      - Implement error catch and report throughout
 **********************************************************/

// extends the Date object to have a function to add hours to the date
Date.prototype.addHours = function (h) {
    this.setTime( this.getTime() + (h*60*60*1000) );
    return this;
}

// Select which calendar to move events on
var CALENDAR = 'To Do';

/*---------------------------------------------------------------*\
 * setTriggers attempts to set a trigger if the number of triggers
 * is zero.  The trigger is created to run at midnight every day
 * in the timezone of the calendar.
 \*---------------------------------------------------------------*/
function setTriggers(timezone) {

    var triggersCreated = 0;

    if ( ScriptApp.getProjectTriggers().length >= 1 ) {
        triggersCreated = 0;
    }
    else {
        // Attempt to set trigger
        ScriptApp.newTrigger("myFunction")
            .timeBased()
            .atHour(0)
            .everyDays(1)
            .inTimezone( timezone )
            .create();
        if ( ScriptApp.getProjectTriggers().length >= 1 ) {
            triggersCreated = 1;
        }
        else {
            Logger.log('Error. Could not create trigger!');
            triggersCreated = -1;
        }

    }
    return triggersCreated;
}


// This function is the heart of the script and is called by the trigger.
// Various logging functions exists to troubleshoot any bugs.
function myFunction() {


    // get the calendar to rollover tasks
    var calendars = CalendarApp.getCalendarsByName(CALENDAR);

    // Log number of calendars found
    Logger.log('Found %s matching calendars.', calendars.length);

    /** This code needs to be changed.  Currently the script will not run
     * until a trigger has been set.  The first time the script is run,
     * nothing should happen except for a trigger created.  Any future manual
     * running will work if a trigger has been set.  This functionality may
     * not be desired and should be reworked.  Running the script should
     * default to only setting a trigger.  The main function should not
     * manipulate the calendar.
     **/

     // attempt to create a trigger via timezone of calendar
     var triggersSet = setTriggers( calendars[0].getTimeZone() );
     // if a trigger was set, then do not run the script
     if ( triggersSet == 1 ) {
        Logger.log('Triggers created: ' + triggersSet);
        return 0; 
    }
     else if ( triggersSet == -1 ) {
        Logger.log('No triggers set, could not set one, ending');
        return 0;
    }


     /*******
     * currently this script assumes the calendar is in EST,
     * or more specifically, UTC -05:00.
     * Future versions will deal with timezone changes and
     * daylight savings time.
     *******/

    /**
     * this hours amount will be subtracted from the current server's date
     * and time.
     * This is a temporary work around to the ambiguity between the calendar's
     * time zone and the server which this script runs on time zone.  This
     * assumes the calendar exists within EST ( UTC -5:00 )
     **/
    var hours = -10;
    var today = new Date();

    Logger.log('Found %s matching calendars.', calendars.length);

    var events    = calendars[0].getEventsForDay(today.addHours( hours ));

    Logger.log( 'Number of events: ' + events.length );
    Logger.log( 'Current Hour: ' + today.getHours() );

    /*--------------------------------------------------------*\
     * Move events forward 24 hours
     \*--------------------------------------------------------*/
    for ( var i = 0; i < events.length; i++ ) {

        // if its an all day event
        if ( events[i].isAllDayEvent() ) {
            // add 24 hours to the start of the all day event
            events[i].setAllDayDate( events[i].getAllDayStartDate().addHours(24) );
        }
        // if its not an all day event
        else {
            // add 24 hours to the start and end of the event
            events[i].setTime(
                events[i].getStartTime().addHours(24), // add 24 hours
                events[i].getEndTime().addHours(24)    // add 24 hours
            );
        }
    }
}
