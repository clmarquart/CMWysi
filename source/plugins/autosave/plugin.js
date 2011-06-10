(function($){
  // Loop through the Cmwysi editor objects and
  // create the AutoSave object
  if(typeof wysiwyg["loaded"]==="undefined") {
    wysiwyg["loaded"]={};
  }
  wysiwyg["loaded"]["autosave"] = _loaded;

  // Global AutoSaver Settings
  wysiwyg.opts["AutoSaver"]=wysiwyg.opts.AutoSaver||{};

  var saverSettings={
    delay:(typeof wysiwyg.opts.AutoSaver.delay!="undefined")?parseInt(wysiwyg.opts.AutoSaver.delay):300000,
    autohide:(typeof wysiwyg.opts.AutoSaver.autohide!="undefined")?parseInt(wysiwyg.opts.AutoSaver.autohide):2000
  };

  // The Saver object is the workhorse for the Cmwysi
  // AutoSave plugin.  Contains Start, Stop, Hide.
  var saver = {

    // Starts the Cmwysi autosaver.
    //
    // @param ed - Cmwysi object
    start:function(ed){
      var dt=(new Date()).toString().toLowerCase();
      dt=dt.substring(0,dt.indexOf("gmt"));
      ed.storage.setItem(ed.element.id+"-autosaved",$(ed.wysiDoc).find("body").html());
      var val = "Saved: " + dt;
	    val += "<span class='autoSaveNow' onclick='wysiwyg.editors[\""+ed.element.id+"\"].autoSave.start(wysiwyg.editors[\""+ed.element.id+"\"])'>Save Now</span>";

      $(ed.statusbar).find(".autosave-status").html(val);
      $(ed.statusbar).find(".autosave-status").slideToggle("slow",function(){});
      setTimeout("wysiwyg.editors['"+ed.element.id+"'].autoSave.hide(wysiwyg.editors['"+ed.element.id+"'])",saverSettings.autohide);
      ed["autoSave"]["saver"] = setTimeout("wysiwyg.editors['"+ed.element.id+"'].autoSave.start(wysiwyg.editors['"+ed.element.id+"'])",saverSettings.delay);
    },

    // Stops only the editor associated with the specified editor
    //
    // @param ed - Cmwysi object
    stop:function(ed){
      clearTimeout(ed.autoSave.saver);
    },

    // Hides the editors AutoSave Status
    //
    // @param ed - Cmwysi object
    hide:function(ed){
      $(ed.statusbar).find(".autosave-status").fadeOut("slow",function(){});
    },

    // Shows the status box with given contents
    //
    // @param ed - Cmwysi object
    // @param val - String (Optional)
    showStatus:function(ed,val){
      var status=$(ed.statusbar).find(".autosave-status");
      if(!val && ($(status).html()==="")) {
      	val = "No currently saved version."
		    val += "<span class='autoSaveNow' onclick='wysiwyg.editors[\""+ed.element.id+"\"].autoSave.start(wysiwyg.editors[\""+ed.element.id+"\"])'>Save Now</span>";
      }
      if (val) {
    	  $(status).html(val);
      }
      $(status).show();
      setTimeout("wysiwyg.editors['"+ed.element.id+"'].autoSave.hide(wysiwyg.editors['"+ed.element.id+"'])",saverSettings.autohide);
    }
  };

  function showSaveOptions(ev,ed){
	  saver.showStatus(ed);
  }

  // isLoaded hook that is called each time a CmwysiEditor is loaded.
  //
  // @ed - Cmwysi Object
  function _loaded(ed){
    ed["autoSave"]=saver;

    var saved=$("<div/>").addClass("autosave-status").css({"display":"none"});
    var saveIcn=$("<li/>").addClass("sprite")
					.addClass("autosave-clipboard")
			    .append(saved)
			    .bind("click.cmwysi.autosave",function(ev){showSaveOptions(ev,ed);});
    $(ed.statusbar).find("ul").append(saveIcn);

    //If the default content of the editor is empty, but we have something in
    //localStorage, use that.
    //
    //TODO Add a global setting to turn this off.
    if(($.trim($(wysiwyg.editors[ed.element.id].wysiDoc).find("body").html())=="") &&
       (ed.storage.getItem(ed.element.id+"-autosaved")!="")) {
      $(ed.wysiDoc).find("body").html(ed.storage.getItem(ed.element.id+"-autosaved"));
      ed.autoSave.showStatus(ed, "Restored from Previous Version.");
    }

    setTimeout("wysiwyg.editors['"+ed.element.id+"'].autoSave.start(wysiwyg.editors['"+ed.element.id+"'])",saverSettings.delay);
  }

  // Global Function to Stop All Savers
  wysiwyg["stopSaving"]=function(){
    for(var ed in wysiwyg.editors){
      if(ed=="length")continue;
      clearTimeout(wysiwyg.editors[ed].autoSave.saver);
    }
  };
})(jQuery);
