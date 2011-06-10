/**
 * CMWysi. A jQuery WYSIWYG
 * http://www.cmwysi.com/
 *
 * Copyright (c) 2009 Cody Marquart
 * Dual licensed under the MIT and GPL licenses.
 * http://www.cmwysi.com/License
 *
 * Date: 2009-10-09
 */
 
(function($){
  /**
   * jQuery CMWYSI Function.
   *
   * Usage: $("textarea").cmwysi({option:value});
   *
   * @param o - JSON object for overriding default options
   */
  $.fn.cmwysi = function(o) {
    var t = this;
    $("body").append($("<div id='dialog' />"));
    $(t).closest("form").find("input[name='submit']").bind("click.cmwysi",function(){
      $(wysiwyg.onsubmit).each(function(i){
        wysiwyg.onsubmit[i]();
      });

      wysiwyg.API.each(wysiwyg.API.update);
      return false;
    });

    wysiwyg=(typeof wysiwyg=="undefined")?Cmwysi:wysiwyg;
    var opts = $.extend(wysiwyg.opts,o);

    JS.Require(opts.location+"/plugins/plugins.js",false,function(){      
      t.each(function() {
        wysiwyg.editors[this.id] = new CmwysiEditor(this,opts);
        wysiwyg.editors[this.id].init(wysiwyg.editors["length"]);
        wysiwyg.editors["length"]++;
        if (!wysiwyg.active) { 
          wysiwyg.active = wysiwyg.editors[this.id]; 
        }
      });
    });
  };

  /**
   * The Cmwysi object which will be stored as window.wysiwyg.
   */
  var Cmwysi = {
    active:null,
    images:[],
    nodechanges:[],
    onsubmit:[],
    rawjs:[],
    isReady:false,
    waiting:true,
    editors:{length:0},
    loadcalls:[],
    packages:{loaded:{}},
    opts: {
      host : window.location.protocol+"//",
      domain : window.location.host+"",
      folder : window.location.pathname,
      location : window.location.protocol+"//"+window.location.host+"/cmwysi",
      html: "<?xml version=\"1.0\" encoding=\"utf-8\"?>"+
            "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Strict//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd\">" +
              "<html xmlns=\"http://www.w3.org/1999/xhtml\" xml:lang=\"en\" lang=\"en\">" +
              "<head>" +
                "<meta name='frame' content='{%FRAME%}' />" +
                "<style> html,body{height:100%;margin:0;} body {padding:5px;}  </style>" +
              "</head>" +
              "<body>" +
                "{%CONTENT%}" +
              "</body>" +
            "</html>",
      width: 600,
      height: 200,
      linebreak:"br",
      color: "black"
    },
    context : {
      definitions : {
        "*":{
          "Copy":{name:"Copy",cmd:"wysiwyg.Clipboard.copy",args:[false]},
          "Paste":{name:"Paste",cmd:"wysiwyg.Clipboard.paste"},
          "Cut":{name:"Cut",cmd:"wysiwyg.Clipboard.cut"}
        }
      }
    },

    /**
     * Eval the JavaScript by removing comment wrapper
     *
     * @param js - The Raw JavaScript to remove comments from and eval()
     */
    evalScript:function(js) {
      eval(js.substring(2,js.length-2));
    },

    /**
     * Load the Packages.  This eval's the JavaScript that may have
     * already been loaded. Otherwise, it will load and then eval
     * here.
     *
     * @param p -Packages to load
     * @param w -Current wysiwyg
     * @param f
     */
    loadPackages:function(p,w,f) {
      var packs = {};
      for(var pack=0;pack<p.length;pack++) {
        var part;
        if (p[pack].match(/(.*)\[([a-zA-Z0-9:]+)\]/)) {
          part = p[pack].match(/(.*)\[([a-zA-Z0-9:]+)\]/);
          part[0]=part[1];
          part[1]=part[2];
          part.pop();
        } else { //if (p[pack].match(/\./)) {
          part = p[pack].split(".");
        } 
        packs[pack] = false;
        var wysiLoaded = wysiwyg.packages.loaded;
        wysiLoaded[part[0]] = false;

        JS.Use("plugin."+part[0],function(){     
          if(typeof wysiwyg.packages[part[0]]==="object") {
            var controls = w.storage.getItem(w.element.id+"-"+part[0]);
            if (controls === null) {
              controls = part[1]||"*";
            } else if (controls !== "") {
              controls = controls.split(",");
            } else {
              controls = [];
            }
            packs[pack] = true;
            wysiLoaded[part[0]] = true;
            if (controls.length>0) {
              wysiwyg.packages[part[0]]._init(controls,w);
            }
          } else {
            JS.Require(w.opts.location+"/plugins/"+part[0]+"/plugin.js",true,function(){
              packs[pack] = true;
              wysiLoaded[this.name] = true;
            });
          }
        });
      }

      wysiwyg.packagesLoaded(f,300,wysiLoaded,w);
    },

    /**
     * Timeout that checks that all packages have
     * been loaded.
     */
    packagesLoaded:function(f,to,packs,ed){
      var alltrue = true;
      for(var w in packs){
        if(packs[w]===false){
          alltrue = false;
          break;
        }
      }
      if(!alltrue){
        setTimeout(function(){wysiwyg.packagesLoaded(f,to,wysiwyg.packages.loaded,ed)},to);
      } else {
        f(ed);
      }
    },

    /**
     * TooltipManager
     * -Add, Create, Show tooltips for the WYSIWYG
     */
     TooltipManager : {
       tipper:null,
       create:function(){
       },
       show:function(ev,txt){
         var src = wysiwyg.utils.eventSource(ev)
         var offset = $(src).offset();
         $("#cmwysi-tooltip").css({left:offset.left+0,top:offset.top+40});
         $("#cmwysi-tooltip").text(txt).show();
       },
       hide:function(){
         $("#cmwysi-tooltip").hide();
       }
     },

     KeyManager : {
       KeyChar : function(code){
         return String.fromCharCode(code);
       },
       Watch : {
         /*
         */
         "ctrl": {"C":["wysiwyg.Clipboard.copy(false)"],
                  "V":["wysiwyg.Clipboard.paste()"],
                  "X":["wysiwyg.Clipboard.cut()"]
                 }
       },
       Run : function(ev) {
         var w = wysiwyg;
         var km = w.KeyManager;

         km.Check.Control(ev);
       },
       Check : {
         Control : function(ev) {
           var w = wysiwyg;
           var km = w.KeyManager;
           if(km.Watch["ctrl"] && ev.ctrlKey){
             var keyChar = km.KeyChar(ev.keyCode);
             if (km.Watch["ctrl"][keyChar]){
               for(var x=0;x<km.Watch["ctrl"][keyChar].length;x++){
                 eval(km.Watch["ctrl"][keyChar][x]);
               }
             }
           }
         }
       }
     },

     /**
      * API Class.  Used to manage the editors.
      */
     API:{
      create:function(name,element,opts){
        var w=wysiwyg;
        w.editors[name]=new CmwysiEditor(element[0],opts);
        w.editors[name].init(wysiwyg.editors["length"]);
        return w.editors[name];
      },
      update:function(ed){
        var w=wysiwyg;
        if(typeof ed === "string"){
          var t=w.editors[ed];
        } else {t = ed}

        $(t.element).val($(t.wysiDoc).find("body").html());
        return false;
      },
      remove:function(ed){
        $("#"+ed).prev().remove();
        $("#"+ed).remove();
      },
      set:function(content,t){
        if(typeof t == "undefined"){
          var w=wysiwyg;
          t=w.active;
        }
        $(t.element).html(content);
        $(t.wysiDoc.body).html(content);
      },
      setActive:function(id,ed){
        if(ed) {
          wysiwyg.active=ed;
        } else {
          wysiwyg.active=wysiwyg.editors[id];
        }
      },
      focus:function(t){
        var hid = $("<input/>").attr("type","hidden").attr("id","hiddenFocus");
        $(t.wysiDoc).find("body").append(hid);
        $(t.iframe).focus();
        $(t.iframe).contents().find("body *").focus();
        $(t.wysiDoc).find("body #hiddenFocus").remove();
      },
      each:function(func){
        var eds = wysiwyg.editors;
        for(var ed in eds){
          if((eds.hasOwnProperty(ed))&&(ed!=="length")){
            wysiwyg.API.update(eds[ed]);
          }
        }
      },
      /**
       * Internal execCommand function.  We use it internally
       * to allow for previous actions to occur, like the
       * snapshot.
       */
      _execCommand:function(cmd,t){
          t.ActionManager.snap(t);
          t.wysiDoc.execCommand(cmd, false, {});
      }
    },

    ToolbarManager : {
      Save : function(toolbar) {
        var ed = wysiwyg.utils.getEditor(toolbar);
        var order = [];
        var optPacks = ed.opts.packages.split(/,/);

        $.each($(toolbar).children("ul[class]"),function(){
          order[order.length] = this.className.replace(/package-/,"");
        });

        var tmpArr = $.grep(optPacks,function(n,i){
          return ($.inArray(n,order)<0);
        });

        ed.storage.setItem(ed.element.id+"-toolbar",$.merge(order,tmpArr));
      },
      GetOrder : function(ed) {
        var order = ed.storage.getItem(ed.element.id+"-toolbar");
        return (order)?order.split(/,/):null;
      },
      AddList : function(ed,ul) {
        $(ul).append($("<span/>")
                      .addClass("dyn-handle")
                      .append($("<span/>")
                                .addClass("sprite")
                                .addClass("dyn-menu")));
        $(ed.toolbar.element).append(ul);
      },
      HasList : function(ed,package) {
        return ($(ed.toolbar.element).find("."+package).length>0);
      },
      Rearrange : function(ed,ord) {
        var tbarElm = $(ed.toolbar.element);

        $.each(order,function(index){
          $(tbarElm)
            .find("."+order[index])
            .insertAfter(".cmwysi-"+ed.element.id+" ."+order[index-1]);
        });
      }
    },

    /**
     * Clipboard object for tracking and reverting
     * content changes.
     */
    Clipboard:{
      contents:null,
      history:[],
      copy:function(ev,remove){
        var w=wysiwyg,t,cb,cbc;
        t=w.active
        cb = w.Clipboard;
        
        if($(t.selection.node).text()==t.selection.text){
          cbc=$($(t.selection.node).clone())[0];
        }else if (t.selection.fullNode()){
          cbc=$($(t.selection.parent).clone())[0];
        }else if (t.selection.type=="#text"){
          cbc=t.wysiDoc.createTextNode(t.selection.text);
        }else{
          cbc=t.selection.node;
        }
        cb.contents = cbc;

        cb.history.push(cb.contents);
        if(cb.history.length>10){
          cb.history.pop();
        }

        if(remove) {
          t.selection.rng.deleteContents();
          //t.selection.replaceSelection("");
        }

        return false;
      },
      cut:function(ev){
        wysiwyg.Clipboard.copy(ev,true);
        return false;
      },
      paste:function(ev,node){
        wysiwyg.active.ActionManager.snap();
        if(node == undefined){
          wysiwyg.active.selection.replaceSelection($(wysiwyg.Clipboard.contents).clone()[0]);
        } else {
          wysiwyg.active.selection.replaceSelection($(node).clone()[0]);
        }
        return false;
      },
      load:function(obj){
        var cb = wysiwyg.Clipboard;
        var loadClick=function(ev){
                        var cn = cb.contents=cb.history[$(this).data("clipboard-item")];
                        cb.paste(cn);
                      };
        $(obj).children(":not(.ui-widget-header)").remove();
        for(var n in cb.history){
          if(cb.history.hasOwnProperty(n)){
            var txt = ($(cb.history[n]).text()!=="")?$(cb.history[n]).text():cb.history[n].nodeValue;
            var nodeName = (cb.history[n].nodeName==="#text")?"#Text":"&lt;"+nodeName+" /&gt;";
            $(obj).append($("<div/>")
                            .addClass("clipboard-item")
                            .html(((nodeName.toLowerCase()==="#text")?"Text":nodeName) + " - " + txt)
                            .data("clipboard-item",n)
                            .click(loadClick));
          }
        }
      }
    },

    /**
     * Utils Class
     */
    utils:{
      eventSource:function(src){
        return (src.srcElement)?src.srcElement:src.target;
      },
      contextcontrol : function(ev) {
        var src=wysiwyg.utils.eventSource(ev);
        var t=wysiwyg.utils.getMetaEditor(src);
        if (ev.button == 2) {
          t.context.show(src,{},ev,t);
        } else {
          if(t) {
            t.context.hide(t);
            $(".editor-clipboard").slideUp();
          }
        }
      },
      getEditor:function(node){
        var act = wysiwyg.editors[$($(node).closest(".cmwysiFrame").next()).attr("id")];
        if (act){
          wysiwyg.API.setActive(act.element.id,act);
          return act;
        }
        return null;
      },
      getMetaEditor:function(src){
        var act = wysiwyg.editors[$(src).closest("html").find("meta[name='frame']").attr("content")];
        if (act) {
          wysiwyg.API.setActive(act.element.id,act);
          return act;
        }
        return null;
      }
    },///// End of Utils //////

    /**
     * Menu Object
     */
    menu:{
      show:function(src,b,c){
        $(".cm_menuDrp").hide();
        $(src).parent().next().toggle();
      }
    },

    nodechange:function(ev) {
      var w=wysiwyg;
      var src = w.utils.eventSource(ev);
      var t=w.utils.getMetaEditor(w.utils.eventSource(ev));

      if((typeof t != "undefined") && (t)) {
        if(ev.type==="click"){
            //Hide Menus
            $(".cm_menuDrp").hide();
            t.path.updatePath(ev.target,t);
        }

        //Call any node change extensions
        for (var nc in w.nodechanges) {
          if(w.nodechanges.hasOwnProperty(nc)){
            var func = w.nodechanges[nc];
            func(t,src,ev);
          }
        }
      }
      return true;
    },

    _focus:function(ev){
      wysiwyg.active=wysiwyg.editors[$(wysiwyg.utils.eventSource(ev)).find("meta[name='frame']").attr("content")];
    },

    selection:{
      setSelection : function(ev) {
        var w = wysiwyg;
        var t = w.active;
        t.selection.setSelection(ev);
        return true;
      },
      replaceSelection : function(html,ed){
        //IE
        if (typeof ed.selection.obj.pasteHTML=="function"){        
          var doc=ed.iframe[0].contentWindow.document
          html=doc.selection.createRange();
          ed.selection.obj.pasteHTML(html);
        } else {
          ed.wysiDoc.execCommand("insertHTML",false,html);
        }
      }      
    },

    /**
     * CMWysi.Control Object
     */
    Controls : {
      /**
       * Create Drop-down Control
       */
      createDropDown:function(cmd,cntrlOpts) {
        var dropClick=function(e){
                        wysiwyg.active.ActionManager.snap(wysiwyg.active);
                        cntrlOpts.events[ev](e);
                      };
        var dropCntrlClick=function(ev) {
                              var src = wysiwyg.utils.eventSource(ev);
                              var dropid = $(src).closest(".cm_menu").attr("id");
                              var menuEd = $(src).closest(".toolbar").next().data("element-name");

                              wysiwyg.menu.show(src,dropid,menuEd);
                           };

        var box = $("<div/>").addClass("cm_menuTxt").html(cntrlOpts.title);
        var act = $("<div/>").html("&nbsp;").addClass("sprite").addClass("cm_menuAct");

        var control;
        var drpItems = $("<dl/>");

        for (var ev in cntrlOpts.events) {
          if(ev=="click"){
            $(drpItems).find("span.dd_content").bind("click",dropClick);
          }
        }

        var drp = $("<div/>").addClass("cm_menuDrp").append( drpItems );
        control = $("<div/>")
                    .attr("id","control-"+cmd)
                    .addClass("control-"+cmd)
                    .addClass("cm_menu")
                    .append($("<div class='cm_menuTop'/>")
                              .append(box)
                              .append(act)
                              .click(dropCntrlClick))
                    .append(drp);

        return control;
      },
      addDropItems:function(cntrl,items,events){
        var dropItemClick=function(ev) {
                            var src = wysiwyg.utils.eventSource(ev);
                            var dropid = $(src).closest(".cm_menu").attr("id");
                            var menuEd = $(src).closest(".toolbar").next().data("element-name");

                            wysiwyg.menu.show(src,dropid,menuEd);
                            $(src).closest(".cm_menuDrp").hide();
                          };
        var addHover=function(){$(this).addClass("drp-hover");};
        var removeHover=function(){$(this).removeClass("drp-hover");};
        var menuEvents=function(e){
                        wysiwyg.active.ActionManager.snap(wysiwyg.active);
                        events[ev](e);
                        $(this).closest(".cm_menuDrp").hide();
                      };
        for (var it in items) {
          if(items.hasOwnProperty(it)){
            var ddhndl = $("<span/>").addClass("dd_handle").html("&nbsp;");
            var ddcont = $("<span/>").addClass("dd_content").html(it).attr(items[it].name,items[it].value);
            var dd = $("<dd/>").append(ddhndl)
                               .append(ddcont)
                               .addClass(it)
                               .click( dropItemClick )
                               .hover( addHover, removeHover );

            $(cntrl).find(".cm_menuDrp dl").append(dd);
          }
        }
        for (var ev in events) {
          if(events.hasOwnProperty(ev)){
            $(cntrl).find(".cm_menuDrp dl").find("span.dd_content").bind(ev,menuEvents);
          }
        }
      },

      /**
       * Create Control w/ Dialog
       *
       * @param cmd - Name of the command
       * @param cntrlOpts - Object containing dialog settings
       * @param ed - Editor which the dialog is being added to
       */
      createDialog: function (cmd,cntrlOpts,ed) {
        var control;

        var button = $("<span/>")
                        .addClass(cmd)
                        .addClass("sprite")
                        .attr("title",cmd)
                        .css({"background-position":cntrlOpts.bgPos})
                        .html("&nbsp;");

        control = $("<li/>")
                    .append(button)
                    .attr("id","control-"+cmd)
                    .addClass("control-"+cmd)
                    .attr("id","li_"+cmd)
                    .hover(function() {
                        $(this).css({background:"white"});
                      },
                      function() {
                        if(! $(this).hasClass("active") ) {
                          $(this).css({background:"none"});
                        }
                    });

        $(control).click(function(ev,opts) {
          var src = wysiwyg.utils.eventSource(ev);
          cntrlOpts = ed.controls.dialog[src.title].settings;

          $("#dialog").html(cntrlOpts.message.html);
          $("#dialog").dialog({
              modal:true,
              autoOpen:false,
              title:cntrlOpts.title,
              width:cntrlOpts.width,
              height:"auto",
              zIndex:20000,
              resizable:false,
              buttons : {
                "Ok" : function(ev) {
                  wysiwyg.active.ActionManager.snap(wysiwyg.active);
                  eval(cntrlOpts.callback+"(ev)");
                  $(this).dialog("close");
                },
                "Cancel" : function(ev){
                  $(this).dialog("close");
                }
              }
          });
          $("#dialog")
            .unbind("dialogopen")
            .bind("dialogopen",function(ev){
              var ed  = wysiwyg.active;
              var ui = wysiwyg.utils.eventSource(ev);

              $(ui).prev().html(cntrlOpts.title);
              cntrlOpts = ed.controls.dialog[src.title].settings;

              if(cntrlOpts.dynamicContent){
                eval(cntrlOpts.dynamicContent+"(ev,wysiwyg.active)");
              }
            })
            .dialog("open");
        });

        control.hover(function(ev) {
            wysiwyg.TooltipManager.show(ev,(cntrlOpts.tip||cmd));
          },
          wysiwyg.TooltipManager.hide);

        if(ed !== undefined) {
          ed.controls["dialog"]=ed.controls.dialog||{};
          ed.controls.dialog[cmd] = {settings : cntrlOpts};
        }

        return control;
      },
      /**
       * Create Standard Button Control
       */
      createButton:function(cmd, cntrlOpts, ed) {
        var control;
        wysiwyg["images"][cntrlOpts.icon]=$("<img/>").attr("src",cntrlOpts.icon)
                                                     .attr("title",cmd)
                                                     .width("16px")
                                                     .height("16px");

        control = $("<li/>").append($("<span/>").addClass(cntrlOpts["class"])
                                                .addClass(cmd))
                            .hover(function() {$(this).addClass("hover");},
                                   function() {$(this).removeClass("hover");})
                            .data("cmwysi-cmd",cmd)
                            .addClass("control-"+cmd)
                            .attr("id","control-"+cmd);

        if (cntrlOpts["css"]!=undefined) {
          $(control).find("span").attr("style",cntrlOpts["css"]);
        } else {
          $(control).find("span").append(wysiwyg.images[cntrlOpts.icon]);
        }

        if ((cntrlOpts.func !== null)&&(typeof cntrlOpts.func!=="undefined")) {
          control.bind("click.cmwysi",function() {
                   if($(this).hasClass("active")) {
                     $(this).removeClass("active");
                   }
                 })
                 .bind("mousedown.cmwysi",function(ev){
                   wysiwyg.API.setActive($(wysiwyg.utils.eventSource(ev)).closest(".cmwysiFrame").data("cmwysi"));
                   cntrlOpts.func(ed,ev);
                 });
        } else {
          control.bind("mousedown.cmwysi",function(ev) {
            if (ev.button == 2) {
              var src = wysiwyg.utils.eventSource(ev);
              var ed = wysiwyg.utils.getEditor(src);

//              ed.toolbar.context.show(ev);
            } else {
              if (! $(this).hasClass("disabled")) {
                var cmd = $(this).data("cmwysi-cmd")||$(this).find("span").attr("class");

                var t = wysiwyg.editors[$(wysiwyg.utils.eventSource(ev)).closest(".cmwysiFrame").data("cmwysi")];
                wysiwyg.API.setActive($(wysiwyg.utils.eventSource(ev)).closest(".cmwysiFrame").data("cmwysi"));
                wysiwyg.API._execCommand(cmd,t);

                if($(this).is(".active")){
                  $(this).removeClass("active");
                } else {
                  $(this).addClass("active");
                }
              }
            }
          });
        }
        control.hover(function(ev){
                        wysiwyg.TooltipManager.show(ev,(cntrlOpts.tip||cmd));
                      },wysiwyg.TooltipManager.hide);
        return control;
      }
    }
  }; ////// END: Global cmwysi object //////

  /**
   * CMWysiEditor Object
   */
  function CmwysiEditor(element,opts){
    this.dropmenus={};
    this.toolbar={
      Store : function(ed,pack){
        var toStore=[];
        $(pack).find("[class^='control-']:visible").each(function(){
          var name = $(this).attr("id").replace(/control-/,"");
          toStore[toStore.length]=name;
        });
        packId = $(pack).attr("class").replace(/package-/,"");
        ed.storage.setItem(ed.element.id+"-"+packId, toStore.join(","));
      }
    };
    this.events={};
    this.nodechanges=[];
    this.opts=opts;
    this.element=element;
    this.storage = window.localStorage||localStorage;
    this.controls={};
    this.location=this.opts.host+this.opts.domain+this.opts.folder;
    this.init=function(cnt){
      this["index"]=cnt;

      //Grab the html from the textarea
      this.initialContent = $(this.element).text();
      var numEditors=wysiwyg.editors["length"];

      //Create iFrame
      var iframe = this.iframe = $(document.createElement("iframe"))
            .css({height: (this.storage.getItem(this.element.id+".height")!==null)?this.storage.getItem(this.element.id+".height")+"px":this.opts.height+"px",
                  width:"100%",
                  background:"#FFFFFF"})
            .attr('id', 'cmwysi_'+numEditors)
            .attr('name','cmwysi_'+numEditors)
            .data("element-name",$(this.element).attr("id"));

      // Create toolbar
      var toolbarElement = this.toolbar["element"] = $("<div/>")
                                                      .addClass("toolbar")
                                                      .sortable({
                                                        handle:'.dyn-handle',
                                                        items:'ul',
                                                        stop:function(){
                                                          wysiwyg.ToolbarManager.Save(this)
                                                        }
                                                      });

      // Create statusbar
      var statusbar = this.statusbar = $("<div/>").css({background:this.opts.toolbarBg})
                                                  .addClass("statusbar")
                                                  .addClass("ui-widget-header")
                                                  .append($("<div/>").addClass("path"))
                                                  .append(this.createTaskbar());

      //Put it all together
      this.wysiwyg = $('<div/>').css({
                                  width:(this.storage.getItem(this.element.id+".width")!==null)?this.storage.getItem(this.element.id+".width")+"px":this.opts.width+"px"
                                })
                                .addClass('cmwysiFrame').addClass('cmwysi-'+this.element.id)
                                .data("cmwysi",$(this.element).attr("id"))
                                .append(toolbarElement)
                                .append(iframe)
                                .append(statusbar)
                                .append($("<div id='context-menu'></div>").hide().html(this.context.def_menu));

     if(typeof this.opts.resizable==="undefined" && this.opts.resizable!=="false"){
       this.wysiwyg.resizable({
         start:function(ev,ui){
           wysiwyg.active=wysiwyg.utils.getEditor(wysiwyg.utils.eventSource(ev));
         },
         resize:function(ev,ui){
           $(this).find("iframe").height(
             $(this).height()-
             $(this).find(".toolbar").height()-
             $(this).find(".statusbar").height());
           $(this).find("iframe").css("width","100%");
           wysiwyg.active.storage.setItem(wysiwyg.active.element.id+".height",$(this).height());
           wysiwyg.active.storage.setItem(wysiwyg.active.element.id+".width",$(this).width());
         },
         animate:false
       });
     }

      //Append the Editor, and hide the textarea
      $(this.element)
        .before(this.wysiwyg)
        .addClass("cmwysi-input")
        .hide();

      this.createClipboard();
      this.parentForm = $(element).closest("form");

      //Add tooltip to DOM. Maybe only one is need since we'll never show
      //more than one at a time.
      if(!document.getElementById("cmwysi-tooltip")) {
        $("body").append($("<div/>").attr("id","cmwysi-tooltip").hide());
      }

      //Grab iFrame DOM Document
      this.wysiDoc = this.iframe[0].contentWindow.document;
      try {
        this.wysiDoc.designMode = 'on';
      } catch (e) {
        $(this.wysiDoc).focus(function() {
          self.designMode();
        });
      }

      // Prepare the wysiwyg iframe document element
      this.wysiDoc.open();
      this.wysiDoc.write(this.opts.html.replace("{%CONTENT%}",this.initialContent).replace("{%FRAME%}",this.element.id));
      this.wysiDoc.close();
      this.wysiDoc.contentEditable='true';

      //Lets load plugins
      var packsToLoad = (wysiwyg.ToolbarManager.GetOrder(this)!==null)?
                          wysiwyg.ToolbarManager.GetOrder(this):
                          this.opts.packages.split(",")

      wysiwyg.loadPackages(packsToLoad,this,this.isLoaded);

      $(this.iframe[0]).css({width:$(this.iframe[0]).closest(".cmwysiFrame").width()+1+"px"});
      $(this.wysiDoc).focus(wysiwyg._focus);

      // Remove Browsers contextmenu actions
      $(this.wysiDoc.body).bind("contextmenu.cmwysi", function() {return false;});
      $(document).bind("contextmenu.cmwysi",function() {return false;});

      // Add events
      $(this.wysiDoc.body)
        .bind("click.cmwysi",this.selection.setSelection)
        .bind("click.cmwysi",function(ev){
          wysiwyg.nodechange(ev);
        });

      $(this.wysiDoc.body).bind("mousedown.cmwysi",wysiwyg.utils.contextcontrol);
      $(this.wysiDoc).bind("keydown.cmwysi",function(ev){
        switch (ev.keyCode.toString()){
          case "13":
            try{
              var newNode = document.createElement(wysiwyg.active.opts.linebreak);
              wysiwyg.active.selection.replaceSelection(newNode);
              // wysiwyg.active.selection.obj.extend(newNode,1);
              // wysiwyg.active.selection.obj.collapseToEnd();
              wysiwyg.active.selection.setSelection(ev);
            } catch(e){}
            return false;
            break;
          case "93":
          default:
            break;
        }
      });
      $(this.wysiDoc).bind("keyup.cmwysi",wysiwyg.KeyManager.Run);
    };

    this.isLoaded = function(editor) {
      //Call any node change extensions
      if(typeof wysiwyg["loaded"]!=="undefined"){
        editor.createToolbar(editor);
        for (var lc in wysiwyg.loaded) {
          if(wysiwyg.loaded.hasOwnProperty(lc)){
            wysiwyg.loaded[lc](editor);
          }
        }
        $.each(wysiwyg.loadcalls,function(){
          this(editor);
        });
        
        
        if(editor.opts.callback){
          editor.opts.callback(editor);
        }
      }
    };

    /**
     * CMWYSI Selection Object
     */
    this.selection={
      node:null,
      text:"",
      obj:null,
      parent:{},
      type:"",
      rng:null,
      collapsed:true,
      setSelection:function(ev) {
        var w = wysiwyg,t;

        if (typeof ev.type!=="undefined"){
          t=w.utils.getMetaEditor($(wysiwyg.utils.eventSource(ev)));
        } else {
          t=w.utils.getMetaEditor(ev);
        }
        wysiwyg.active = t;

        if((t!==null)&&(typeof t !== "undefined")){
          var wdoc = t.wysiDoc;
          var sel = t.selection;

          if (ev.nodeType != 1) {sel.node=w.utils.eventSource(ev);}
          else {sel.node = ev;}

          try{
            //IE
            if (typeof wdoc.selection === "undefined"){
              sel.text=wdoc.getSelection().toString();
              sel.obj=t.iframe[0].contentWindow.getSelection();
              sel.parent=sel.obj.anchorNode.parentNode;
              sel.type=sel.obj.anchorNode.nodeName;
              sel.rng=sel.obj.getRangeAt(0);
              sel.collapsed=sel.rng.collapsed;
            } else {
              sel.text = wdoc.selection.createRange().text;
              sel.obj  = wdoc.selection.createRange();
              sel.parent = sel.obj.parentElement();
              sel.type = wdoc.selection.type;
              sel.rng = wdoc.selection.createRange();
              sel.collapsed=(sel.text==="")?true:false;
            }
          } catch(e) {}

          return true;
        }
        return false;
      },
      selectFull : function(node,ed) {
        var t = ed||wysiwyg.active;
        var offset=$(node).contents().length;
        // if ($.browser.mozilla) {
        if (t.iframe[0].contentWindow.getSelection) {
          t.iframe[0].contentWindow.getSelection().collapse(node,0);
          t.iframe[0].contentWindow.getSelection().extend(node,offset);
        } else { //if ($.browser.msie) {
          t.selection.rng.expand("word");
          t.selection.rng.select();
        }
      },
      replaceSelection : function(newNode) {
        var t = wysiwyg.active;

        t.ActionManager.snap();
        if (typeof t.selection.rng.insertNode=="function") {
          t.selection.rng.deleteContents();
          try{
            t.selection.rng.insertNode(newNode);
          }catch(e){ }
        } else {
          t.selection.rng.select();
          t.selection.rng.pasteHTML(newNode);
        }
      },
      fullNode : function() {
        return ($.trim(this.text) == $.trim($(this.parent).text()));
      }
    }; ///// End of Selection Object /////

    /**
     * ActionManager
     * -Used to perform Undo and Redo Actions
     * -Take snapshots of the editor
     */
    this.ActionManager={
      versions:[],
      active:-1,
      snap:function(t){
        t=(typeof t != "undefined")?t:wysiwyg.active;
        this.versions.push({"node":t.selection.node,"snap":$(t.wysiDoc).find("body").html()});
      },
      undo:function(t){
        var idx=0;
        if(this.active>0){
          idx=this.active-1;
        } else if (this.active==-1){
          idx=this.versions.length-1;
        }
        if(idx==-1){return;}
        if(idx==(this.versions.length-1)){
          this.versions.push({"node":t.selection.node,"snap":$(t.wysiDoc).find("body").html()});
        }
        
        this.revert(t,this.versions[idx].snap);
        this.active=idx;
      },
      redo:function(t){
        var idx=0;
        if((this.active>=0)&&(this.active<this.versions.length-1)){
          idx=this.active+1;
        }

        if(idx===0){return;}
        this.revert(t,this.versions[idx].snap);
        this.active=idx;
      },
      revert:function(t,snap){
        $(t.wysiDoc).find("body").html(snap);
      }
    };

    /**
     *  Create the Toolbar
     */
    this.createToolbar=function(w) {
      $(w.toolbar.element).data("editor",w.element.id)
                          .bind("click.cmwysi",function(ev){
                            wysiwyg.API.setActive($(wysiwyg.utils.eventSource(ev)).closest(".cmwysiFrame").data("cmwysi"));
                          })
                          .addClass("ui-widget-header");
      $(w.toolbar.element)
        .ContextMenu({
          ed : this,
          name:"ToolbarContext",
          type:"right",
          attachTo:"*[class^='control-']",
          items:{
                 "*":[{
                       name:"Hide",
                       func:function(orig,ev){
                         var ed = wysiwyg.editors[$(orig).closest(".cmwysiFrame").next()[0].id];
                         if($(orig).is("[class^='control-']")){
                          $(orig).hide();
                          return true;
                         } else {
                          var control = $(orig).closest("[class^='control-']");
                          $(control).hide();
                          ed.toolbar.Store(ed,$(control).closest("[class^='package-']"));
                          return true;
                         }
                         return false;
                       }
                     }]
                 }
        });
    }; ///// End of Create Toolbar /////

    /**
     * Create the Taskbar
     */
    this.createTaskbar=function(){
      return($("<div/>").addClass("taskbar").append($("<ul/>").css({"list-style":"none"})));
    };

    /**
     * Create the Clipboard
     */
    this.createClipboard=function(){
      function cbToggle(e){
        $(wysiwyg.utils.eventSource(e))
          .closest(".taskbar").find(".editor-clipboard")
          //.css({marginLeft:"-"+$(".editor-clipboard").width()+"px"})
          .slideToggle(function(ev){
            if($(this).is(":not(:hidden)")){
              wysiwyg.Clipboard.load(this);
            }
          });
      };
      var cbClose=$("<span/>").addClass("sprite  ui-icon-closethick")
                              .css({"float":"right","width":"15px"})
                              .html("&nbsp;");
                              //.bind("click",cbToggle);
      var cb=$("<li/>").addClass("taskbar-clipboard").addClass("sprite")
                       .css({"background-position":"-117px -17px"})
                       .append($("<div/>").hide()
                                          .addClass("editor-clipboard")
                                          .addClass("ui-corner-top")
                                          .append($("<div/>").html("Clipboard")
                                                             .addClass("ui-widget-header")
                                                             .addClass("ui-corner-all")
                                                             .css({margin:"3px",padding:"2px","text-transform":"capitalize"})
                                                             .append(cbClose)))
                       .click(cbToggle);
      $(this.element).prev().find(".taskbar ul").append(cb);
    };

    /**
     * Path object
     */
    this.path = {
      path : "",
      updatePath : function(n,ed) {
        var t = ed||wysiwyg.active;
        t.path.path= [];

        if (n.nodeName.toLowerCase() == "html") {
          t.path.printPath();
        } else {
          var name = n.nodeName;

          if ( $(n).attr("class") ) {
            name += "."+$(n).attr("class");
          }
          t.path.path.push(name);

          var np = n.parentNode;
          while(np) {
            if ((np.nodeName.toLowerCase() == "html")) {break;}

            var name2 = np.nodeName;
            if ( $(np).attr("class") ) {
              name2 += "." + $(np).attr("class");
            }

            t.path.path.push(name2);
            np = np.parentNode;
          }

          if (t.opts.statusbar!==false) {
            t.path.printPath(t);
          }
        }

        return true;
      },
      printPath : function(ed) {
        var t = ed||wysiwyg.active;
        $(t.statusbar).find(".path").html("");

        var pathHtml = $("<ul/>").addClass("pathlist")
                                 .bind("click.cmwysi",this.selectPathObject);

        for(var x = t.path.path.length-1; x>=0; x--) {
          $(pathHtml).append( $("<li/>").html(t.path.path[x]) );
        }
        $(t.statusbar).find(".path").append(pathHtml);
      },
      selectPathObject : function(ev) {
        var t=wysiwyg.utils.getEditor($(wysiwyg.utils.eventSource(ev)).closest(".statusbar"));

        var elm = wysiwyg.utils.eventSource(ev); //(ev.target) ? ev.target : ev.srcElement;
        var txt = $(elm).text();
        var tag;
        if (txt.indexOf(".") >= 0) {
          tag=txt.substring(0,txt.indexOf(".")).toLowerCase();
        } else {
          tag=txt.toLowerCase();
        }

        var selectNode = (t.selection.node.nodeName.toLowerCase()==tag)?t.selection.node:$(t.selection.node).closest(tag)[0];

        t.selection.selectFull(selectNode,t);

        t.path.updatePath(selectNode,t);

        wysiwyg.API.focus(t);
        wysiwyg.active=t;
        t.selection.setSelection(selectNode);
      }
    }; ///// End of Path Object /////

    /**
     * Context Menu
     */
    this.context={
      def_menu : "",
      show : function(elm,opts,ev,t){
        var src = wysiwyg.utils.eventSource(ev).nodeName.toLowerCase();
        var w=wysiwyg;

        var cntxt = $(t.iframe).closest(".cmwysiFrame").find("#context-menu").css("z-index","10000");

        var frameElm=$(elm).closest("html").find("head").find("meta[name='frame']").attr("content");
        var iframePos = $("#"+frameElm).prev().position();
        var clickPos = {top : ev.clientY, left : ev.clientX};
        var type= t.selection.type.toLowerCase();
        var cntxtList = $("<ul/>").html("");

        var newlist = $("<ul/>");
        for (var extended in w.context.definitions) {
          if ((extended=="*")||(extended == src)||(extended==type)) {
            for (var toadd in w.context.definitions[extended]) {
              if(w.context.definitions[extended].hasOwnProperty(toadd)){
                var cmdid = (w.context.definitions[extended][toadd].cmd)?w.context.definitions[extended][toadd].cmd:"";

                var newli = $("<li class='"+extended+"' />").html(toadd).data("command",{cmd:cmdid});

                $(newlist).append(newli);
              }
            }

            $(newlist).append( $("<li/>").append($("<hr/>")) );
          }
        }

        $(cntxtList)
          .append( $(newlist) );

        $(cntxt)
          .css({left:clickPos.left+"px",
                top:clickPos.top+$(t.toolbar.element).height()+"px"})
          .addClass("context-menu")
          .html($(cntxtList).html())
          .show();

        $(cntxt)
          .find("li")
          .hover(function(){$(this).addClass("hover");},
                 function(){$(this).removeClass("hover");})
          .bind("click",function(ev){
            var ext = $(this).attr("class").split(/\s/)[0];
            var args = wysiwyg.context.definitions[ext][$(this).text()].args;

            if(args) {
              args = ","+args.join(",");
            } else {
              args = ""
            }

            eval(wysiwyg.context.definitions[ext][$(this).text()].cmd+"(ev"+args+")");
            $(".context-menu").hide();
          });
      },
      process : function(ev) {
        var src = wysiwyg.utils.eventSource(ev);
        $("#li_"+$(src).attr("id") ).click();
        wysiwyg.context.hide();
      },
      hide : function(t) {
        $(t.iframe)
          .closest(".cmwysiFrame")
          .find("#context-menu")
          .removeClass(".editor-context")
          .hide();
        return true;
      }
    }; ///// End of Context Menu /////
  } //////  End of CmwysiEditor  //////

  
  var JS = window.JS = new function() {
    this.imported={},active=false;
    this.requests=[];
    this.Wait=function(request,func){
      if(JS.requests[request.order-1].done==false){
        setTimeout("JS.Wait(JS.requests["+request.order+"],"+func+")",200);
      } else {
        eval(request.response.responseText);
        if(func){
          func.call(JS, request);
        }
        JS.requests[request.order].done = true;
      }
    };
    this.Require=function(js,auto,callback) {
      var parentThis = this;
      var request = XHR.get({
        url:js,
        success:function(newRequest,res){
          JS.active = false;
          callback=(typeof auto==="function")?auto:callback;
          if(auto==true){
            JS.Store(newRequest.file, res.responseText);
          } else {
            JS.Save(res.responseText);
          }
          var prev = (newRequest.order>0)?JS.requests[newRequest.order-1]:{done:true};
          if(prev.done) {
            JS.requests[newRequest.order].done = true;
            if(auto==true){
              eval(res.responseText);
            }
            if(callback){
              callback.call(JS, newRequest, res);
            }
          } else {
            JS.Wait(newRequest,callback);
          }
        }
      });
      this.requests.push(request);
      return this;
    };
    this.Save=function(js) {
      while(js.match(/^\/\*(.*)\n/)) {
        var executed = /^\/\*(.*)\n([\S|\s]*)\1\*\/$/m.exec(js);
        JS.imported[executed[1]]=executed[2];
        js = js.substr(executed[0].length).replace(/^\n/,"");
      }
    };
    this.Store=function(file,js){
      JS.imported[file] = js;
    };
    this.Use=function(p,func) {
      if (JS.active === true) {
        setTimeout("JS.Use('"+p+"',"+func+")",5);
      } else {
        eval(JS.imported[p]);
        if (func) { func(); }
      }
      return this;
    };
  };
  var XHR = {
    requests : [],
    get : function(request) {
      XHR.requests.push({
        file:request.url,
        order:XHR.requests.length,
        response:null,
        complete:request.complete,
        success:request.success,
        done:false
      });

      var newRequest = XHR.requests[XHR.requests.length-1];
      var req = new XMLHttpRequest();
      req.open('GET', request.url, true);
      req.onreadystatechange = function (a) {
        JS.active = true;
        if (req.readyState == 4) {
          newRequest.response = req;
          request.success(newRequest, req);
        }
      }
      req.send(null);

      return newRequest;
    }
  };


  /**
   * Used for backup if actual Browser localStorage
   * is not available.
   */
  var localStorage={
    items:{},
    getItem:function(key){return this.items[key];},
    setItem:function(key,value){this.items[key]=value;}
  };
})(jQuery);
