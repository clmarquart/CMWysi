(function($){
    wysiwyg.packages["format"]={
      namespace : "format",
      fonts: {
      	"Sans-Serif" : {
      		name:"style",
      		value:"font-family:sans-serif;"
      	},
      	"Serif" : {
      		name:"style",
      		value:"font-family:serif;",
      	}
      },
      controls:["justifyLeft","justifyCenter","justifyFull","justifyRight","outdent","indent","fontname","insertOrderedList","insertUnorderedList"],
      _load:function(method,ed){
          var cntrl={};
          switch (method) {
            case "justifyLeft" :
              cntrl = wysiwyg.Controls.createButton(method,{
                       "icon":"",
                       "class":"sprite",
                       "css":"background-position:-59px -17px"
                      }, ed);
              break;
            case "justifyCenter" :
              cntrl = wysiwyg.Controls.createButton(method,{
                       "icon":"",
                       "class":"sprite",
                       "css":"background-position:-21px -17px"
                      }, ed);
              break;
            case "justifyFull" :
              cntrl = wysiwyg.Controls.createButton(method,{
                       "icon":"",
                       "class":"sprite",
                       "css":"background-position:-59px -17px"
                      }, ed);
              break;
            case "justifyRight" :
              cntrl = wysiwyg.Controls.createButton(method,{
                       "icon":"",
                       "class":"sprite",
                       "css":"background-position:-38px -17px"
                      }, ed);
              break;
            case "indent" :
              cntrl = wysiwyg.Controls.createButton(method,{
                       "icon":"",
                       "class":"sprite",
                       "css":"background-position:-96px -17px"
                      }, ed);
              break;
            case "outdent" :
              cntrl = wysiwyg.Controls.createButton(method,{
                       "icon":"",
                       "class":"sprite",
                       "css":"background-position:-79px -17px"
                      }, ed);
              break;
						case "insertOrderedList" :
							cntrl = wysiwyg.Controls.createButton(method,{
												"icon":"",
												"class":"sprite",
												"css":"background-position: -754px 0"
											}, ed);
							break;
						case "insertUnorderedList" :
							cntrl = wysiwyg.Controls.createButton(method,{
												"icon":"",
												"class":"sprite",
												"css":"background-position: -738px 0"
											}, ed);
							break;
            case "fontname" :
              cntrl = wysiwyg.Controls.createDropDown(method,{id:"fontname_drop",
                                                title:"Select Font",
                                                events:{"click" : this.addFontName}
                                               },ed);

              wysiwyg.Controls.addDropItems(cntrl,this.fonts,{"click":wysiwyg.packages.format.addFontName});
              break;
            default:
              //return null;
              break;
          }
          return cntrl;
      },
      _init:function(controls,ed){
        var cntrl={}, toolUL;
        if(controls==="*"){
          controls = this.controls;
        } else if (controls.match(/:/)) {
          controls = controls.split(":");
        }
        toolUL = $("<ul/>").addClass("package-"+this.namespace);
        if ($.isArray(controls)) {
          
          for(var c=0;c<controls.length;c++) {
            cntrl = this._load(controls[c],ed);

            if (cntrl!=null){
              $(toolUL).append(cntrl)
            }
          }
        } else {
          cntrl=this._load(controls,ed);
          if ($(ed.toolbar.element).find(".package-"+this.namespace).length>0) {
            toolUL = $(ed.toolbar.element).find(".package-"+this.namespace);
          }
          $(toolUL).prepend(cntrl);
//          wysiwyg.ToolbarManager.ListAddControl(ed,"package-"+this.namespace,cntrl);
        }
        if (!wysiwyg.ToolbarManager.HasList(ed,"package-"+this.namespace)) {
          wysiwyg.ToolbarManager.AddList(ed,toolUL);            
        }
      },
      addFontName : function(ev) {
        var w = wysiwyg;
        var src = w.utils.eventSource(ev); //selection.getSrcElement(ev);
        var t = (w.active!="null")?w.active:$("iframe#cmwysi_0");
        var fonts = wysiwyg.packages.format.fonts;
        if (t.selection.obj != null) {
          var selected = $(src).text();
          var newFont = selected; //fonts[selected].value;
          
          if (t.selection.fullNode()) {            
            $(t.selection.node)
              .css("font-family",newFont);
          } else {
            var newNode = "<span style='font-family:"+newFont+";'>";
            newNode    +=   t.selection.text;
            newNode    += "</span>";
            
            w.selection.replaceSelection(newNode,t);
          }
        }
      },
      _nodechange : function(j,src,ev) {
        var w=wysiwyg;
        var t=w.active;
        var selnode = src;

        $(t.toolbar.element)
          .find("#control-fontname .dd_handle").html("&nbsp;").end()
          .find("#control-fontname .cm_menuTxt").html("Select Font");

        //jQuery returns a font-name, regardless of it being set in style
        var font=selnode.style.fontFamily;
        if(font){
          $(t.toolbar.element)
            .find("#control-fontname ."+$.trim(font)+" .dd_handle").html("&bull;").end()
            .find("#control-fontname .cm_menuTxt").html(font);
        }

        switch($(src).css("text-align")){
          case "center":
              $(t.toolbar.element)
                .find(".justifyCenter").parent().addClass("active").end()
                .find(".justifyLeft, .justifyRight").parent().removeClass("active");
              break;
          case "left":
              $(t.toolbar.element)
                .find(".justifyLeft").parent().addClass("active").end()
                .find(".justifyCenter, .justifyRight").parent().removeClass("active");
              break;
          case "right":
              $(t.toolbar.element)
                .find(".justifyRight").parent().addClass("active").end()
                .find(".justifyLeft, .justifyCenter").parent().removeClass("active");
              break;
          default:
              $(t.toolbar.element)
                .find(".justifyRight, .justifyLeft, .justifyCenter").parent()
                .removeClass("active");
            break;
        }
      }
    };

    wysiwyg.nodechanges.push(wysiwyg.packages.format._nodechange);
})(jQuery);
