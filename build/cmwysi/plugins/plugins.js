/*plugin.style
(function($){
    wysiwyg.packages["style"]={
      styles:null,
      namespace:"style",
      controls:["styleDrop"],
      _init:function(controls,ed) {
        var cntrl;
        
        if(controls==="*"){
          controls = this.controls;
        }
        var cntrlNm=null;
        var toolUL = $("<ul/>").addClass("package-"+this.namespace);
        for(var c=0;c<controls.length;c++){
          cntrl=null;
          cntrlNm = controls[c];
          switch (cntrlNm) {
            case "styleDrop":
              cntrl=wysiwyg.Controls.createDropDown(cntrlNm,{
                                            id:"style_drop",
                                            title:"Select Style",
                                            events:{"click":this.addStyle}
                                           },ed);

              this.styles = this.styles||loadStyles(wysiwyg.opts.style);
              wysiwyg.Controls.addDropItems(cntrl,this.styles,{"click":wysiwyg.packages.style.addStyle});

              break;
            default:
              break;
          }
          if (cntrl != null) {
            $(toolUL).append(cntrl);
          }
        }
        wysiwyg.ToolbarManager.AddList(ed,toolUL);
      },
      _nodechange:function(j,src,ev) {
        var w=wysiwyg;
        var t=w.active;
        var selnode = src;
        if(typeof selnode.nodeName != "undefined"){
          var sel_class = selnode.className;
          if(sel_class.length>0){
            sel_class = sel_class.split(" ");
            $(t.toolbar.element).find("#control-styleDrop").find("dd").each(function() {
              $(this).find(".dd_content:eq(0)").each(function() {
                if (! $.inArray($(this).text(),sel_class) ) {
                  $(this).prev().html("&bull;").addClass("activeStyleClass");
                  $(t.toolbar.element).find("#control-styleDrop .cm_menuTxt").html($(this).text());
                } else {
                  $(this).prev().html("&nbsp;").removeClass("activeStyleClass");
                }
              });
            });
          }else{
            $(t.toolbar.element)
              .find("#control-styleDrop .cm_menuTxt")
              .text("Select Style")
              .end()
              .find("#control-styleDrop .dd_handle")
              .html("&nbsp;");
          }
        }
      },
      addStyle : function(ev) {
        var bypassNodes = ["tr","table"];
        //Create local version of `wysiwyg` object
        var w = wysiwyg;
        var t = w.active;
        
        //Store the selected style from the menu
        var seld = $(w.utils.eventSource(ev)).text();
        
        //Grab the selected text or cursor point
        var cursel = t.selection;


        //If the selection is collapsed or a full node, we justadd the class.
        //Else, create a wrapper and insert.
        if(cursel.fullNode()){
            addClass(cursel.parent,seld);
        } else if ($.inArray(cursel.node,bypassNodes)) {
            console.log("Bypass.");
            addClass(cursel.node,seld);
        } else {
          //if (cursel.collapsed){}
          var newnode;
          if((cursel.rng!=null) && (typeof cursel.rng.insertNode=="function")) {
            newnode=document.createElement("span");
            newnode.setAttribute("class",seld);
            newnode.innerHTML=cursel.text;
          } else {
            newnode="<span class='"+seld+"'>"+cursel.text+"</span>";
          }
          cursel.replaceSelection(newnode);
        }
      },
      _loaded:function(ed){
        $(ed.wysiDoc)
          .find("head")
          .append($("<link/>")
                    .attr("href",wysiwyg.opts.style)
                    .attr("rel","stylesheet")
                    .attr("type","text/css"));
      }
    };
    
    wysiwyg.loadcalls.push(wysiwyg.packages.style._loaded);
    wysiwyg.nodechanges.push(wysiwyg.packages.style._nodechange);

    function addClass(node,klass) {
        if ($(node).hasClass(klass)){
          $(node).removeClass(klass);
        }else{
          $(node).addClass(klass);
        }
    }

    function loadStyles(ss) {
      var s={};
      for (var css in ss) {
        $.ajax({
          url:ss[css],
          async:false,
          datatype:"text",
          success:function(a){
            var res=a;
            var cur,sels,style;
            var end=res.indexOf("}");
            while(end>=0) {
              cur=$.trim(res.substring(0,end+1));
              sels=cur.substring(0,cur.indexOf("{")).split(",");
              style=$.trim(cur.substring(cur.indexOf("{")+1,cur.indexOf("}")));
              
              for(var sel in sels) {
                sels[sel] = $.trim(sels[sel]);
                if ($.trim(sels[sel].charAt(0)) == ".") {
                  sels[sel] = $.trim(sels[sel]);
                  if (sels[sel].substr(0,1) == "."){
                    sels[sel] = sels[sel].substr(1);
                  }
                  s[sels[sel]] = {name:"style",value:style.replace("\r\n"," ")};
                }
              }
              
              res = res.substring(end+1);
              end = res.indexOf("}");
            }
          }
        });
      }
      
      return s;
    };
})(jQuery);

plugin.style*/
/*plugin.table
(function($){
  wysiwyg.packages["table"]={
    namespace:"table",
    controls:["table"],
    
    _init : function(controls,ed) {
      var iconbase=wysiwyg.location+"plugins/table/images/";
      var cntrl = {};// = new Object();
      if(controls==="*"){
        controls = this.controls;
      }
      var toolUL = $("<ul/>").addClass("package-"+this.namespace);
      var cntrlNm=null;
      for(var c=0;c<controls.length;c++){
        cntrl = null;
        cntrlNm = controls[c];
        switch (cntrlNm) {
          case "table" :
            cntrl = wysiwyg.Controls.createDialog(cntrlNm,{
                                        icon : iconbase+cntrlNm+".png" ,
                                        width : "200", height : "190",
                                        title : "Insert Table",
                                        tip:"Insert Table",
                                        bgPos:"-200px -18px",
                                        message : {
                                            html:"Rows: <input type='text' name='rows' value='' /><br />"+
                                                 "Columns: <input type='text' name='cols' value='' /><br />"+
                                                 "Header Row: <input type='checkbox' name='th' value='1' />" },
                                        //callback : this._insertTable
                                        callback : "wysiwyg.packages.table._insertTable"
                                      },ed);

            wysiwyg.context.definitions["td"]={
              "Insert Row":{
                name:"insertRow",
                cmd:"wysiwyg.packages.table._insertRow"
              },
              "Insert Column":{
                name:"insertColumn",
                cmd:"wysiwyg.packages.table._insertColumn"
              }
            };
            wysiwyg.context.definitions["tr"]={
              "Merge Cells":{
                name:"mergeCells",
                cmd:"wysiwyg.packages.table._mergeCells"
              }
            };

            break;
          default:
            break;
        }
        if (cntrl!=null){
          $(toolUL).append(cntrl)
        }
      }
      wysiwyg.ToolbarManager.AddList(ed,toolUL);
    },
    _nodechange:function(){ },
    _buildTable:function(r,c,th){
      var tbl=document.createElement("table");
      tbl.setAttribute("border","1");
      var tbdy=document.createElement("tbody");

      var row, cell;
      for(var rIdx=0;rIdx<r;rIdx++){
        row=document.createElement("tr");
        for(var cIdx=0;cIdx<c;cIdx++){
          if ((rIdx===0) && (th)) {
            cell=document.createElement("th");
          } else {
            cell=document.createElement("td");
          }
          cell.innerHTML="&nbsp;";
          row.appendChild(cell);
        }
        tbdy.appendChild(row);
      }
      tbl.appendChild(tbdy);
      return tbl;
    },
    _insertTable:function(ev){
      var src = $(wysiwyg.utils.eventSource(ev)).closest(".ui-dialog");
      var rows=$(src).find("input[name='rows']").val();
      var cols=$(src).find("input[name='cols']").val();
      var th  =$(src).find("input[name='th']").is(":checked");

      //Grab the selected text or cursor point
      var cursel = wysiwyg.active.selection;

      if(cursel.rng==null) {
        return;
      }

      var newnode = wysiwyg.packages.table._buildTable(rows,cols,th);
      console.log(newnode);
      cursel.replaceSelection(newnode);
    },
    _insertRow:function(){
      var t=wysiwyg.active;

      t.ActionManager.snap(t);
      var tr = $(t.selection.parent).closest("tr");
      var tds=$(tr).find("td");
      var tdhtml = "";
      for (var x=0;x<tds.length;x++){
        tdhtml+="<td>&nbsp;</td>";
      }
      $(t.selection.node).closest("tr").after("<tr>"+tdhtml+"</tr>");
    },
    _insertColumn:function(){
      var t=wysiwyg.active;
      var tr=(t.selection.node.nodeName.toLowerCase()=="tr")?t.selection.node:$(t.selection.node).closest("tr")[0];

      t.ActionManager.snap(t);
      $(tr).data("row-id",1).append($("<td/>").html("&nbsp;"));
      var cntCells=$(tr).find("td").length;

      $(tr).closest("table").find("tr").each(function(){
        if($(this).find("td").length<cntCells){
          //$(this).find("td:last").attr("colspan",1+(cntCells-$(this).find("td").length));
          $(this).append($("<td/>").html("&nbsp;"));
        }
      });
    },
    _mergeCells:function(){
      var t=wysiwyg.active;

      t.ActionManager.snap(t);
      var html="";
      var tr=$(t.selection.node).closest("tr");
      $(tr).find("td").each(function(){
        html+=$(this).html();
      });
      $(tr).html("<td colspan='"+this._countCells($(t.selection.node).closest("table"))+"'>"+html+"</td>");
    },
    _countCells:function(tbl){
      var max=0;
      if($(tbl).find("tr").length>1){
        $(tbl).find("tr").each(function(){
          max=($(this).find("td").length>max)?$(this).find("td").length:max;
        });
      } else {
        max=1;
      }
      return max;
    }
  };

  //wysiwyg.nodechanges.push(wysiwyg.plugins.table._nodechange);
})(jQuery);

plugin.table*/
/*plugin.images
(function($){
  wysiwyg.packages["images"]={
    namespace:"images",
    controls:["imageinsert"],
    iconbase : wysiwyg.location+"plugins/images/images/",
    imgSettings :{ "icon":"",
                   width:"450px", height:"250px",
                   bgPos:"-178px -19px",
                   title:"Insert/Edit Image",
                   message:{
                    html:"URL: <input type='text' name='url-image' value='' />"
                   },
                   tip:"Insert Image",
                   callback:"wysiwyg.packages.images.insertImage",
                   dynamicContent:"wysiwyg.packages.images.dynamicContent"
    },
    _init:function(controls,ed){
      var cntrl;
      if(controls==="*"){
        controls = this.controls;
      }

      for(var c=0;c<controls.length;c++){
        cntrl = null;
        switch (controls[c]) {
          case "imageinsert":
            this.imgSettings["icon"] = this.iconbase+controls[c]+".png";
            cntrl = wysiwyg.Controls.createDialog(controls[c],this.imgSettings,ed);

            wysiwyg.context.definitions["img"] = {
              "Edit Image": {
                name:"edit",
                cmd:"wysiwyg.packages.images._editImage"
              }
            };
            break;
          default:
            break;
        }
        if (cntrl != null) {
          wysiwyg.ToolbarManager.AddList(ed,$("<ul/>").addClass("package-"+this.namespace).append(cntrl));
        }
      }
    },
    insertImage : function(ev){
      var src = $(wysiwyg.utils.eventSource(ev)).closest(".ui-dialog");
      var imgsrc = $(src).find("input:eq(0)").val();      
      var img = document.createElement("img");
      
      img.setAttribute("src", imgsrc);
      wysiwyg.active.selection.replaceSelection(img);
    },
    _editImage : function(ev) {
      var t = wysiwyg.active;

      $(t.toolbar.element[0])
        .find(".imageinsert")
        .trigger("click",wysiwyg.packages.images.imgSettings);
    },
    dynamicContent : function(ev,ed){
      if (ed.selection.node.nodeName.toLowerCase()==="img") {
        var src = $(ed.selection.node).attr("src");
        $("#dialog input:eq(0)").val(src);
      }
    }
  }
})(jQuery);

plugin.images*/
/*plugin.format
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
      controls:["justifyLeft","justifyCenter","justifyFull","justifyRight","outdent","indent","fontname"],
      _load:function(method,ed){
          var cntrl={};
          switch (method) {
            case "justifyLeft" :
              cntrl = wysiwyg.Controls.createButton(method,{
                       "icon":"",
                       "class":"sprite",
                       "css":"background-position:-59px -17px"
                      }, ed);
              break
            case "justifyCenter" :
              cntrl = wysiwyg.Controls.createButton(method,{
                       "icon":"",
                       "class":"sprite",
                       "css":"background-position:-21px -17px"
                      }, ed);
              break
            case "justifyFull" :
              cntrl = wysiwyg.Controls.createButton(method,{
                       "icon":"",
                       "class":"sprite",
                       "css":"background-position:-59px -17px"
                      }, ed);
              break
            case "justifyRight" :
              cntrl = wysiwyg.Controls.createButton(method,{
                       "icon":"",
                       "class":"sprite",
                       "css":"background-position:-38px -17px"
                      }, ed);
              break
            case "indent" :
              cntrl = wysiwyg.Controls.createButton(method,{
                       "icon":"",
                       "class":"sprite",
                       "css":"background-position:-96px -17px"
                      }, ed);
              break
            case "outdent" :
              cntrl = wysiwyg.Controls.createButton(method,{
                       "icon":"",
                       "class":"sprite",
                       "css":"background-position:-79px -17px"
                      }, ed);
              break
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

plugin.format*/
/*plugin.basic
(function($){
  wysiwyg.packages["basic"]={
    namespace:"basic",
    controls:["bold","italic","underline","subscript","superscript","createLink","unlink","html","undo","redo","horizontalrule","fullscreen"],
    checkForAnchor:true,
    _init:function(controls,ed){
      var iconbase="../plugins/basic/images/";
      var cntrl,cntrlNm=null,toolUL = $("<ul/>").addClass("package-"+this.namespace);

      if(controls.length<1) {
        return false;
      }

      if(controls==="*"){
        controls = this.controls;
      }

      for(var c=0;c<controls.length;c++){
        cntrl = null;
        cntrlNm = controls[c];
        switch (cntrlNm) {
          case "bold":
            cntrl = wysiwyg.Controls.createButton(cntrlNm,{
                                         "icon":"",
                                         "class":"sprite",
                                         "css":"background-position:-30px 0px"
//                                         func:this._bold
                                         },ed);
            break;
          case "italic":
            cntrl = wysiwyg.Controls.createButton(cntrlNm,{
                                         "icon":"",
                                         "class":"sprite",
                                         "css":"background-position:-45px 0px"
//                                         func:this._italic
                                         },ed);
            break;
          case "underline":
            cntrl = wysiwyg.Controls.createButton(cntrlNm,{
                                         "icon":"",
                                         "class":"sprite",
                                         "css":"background-position:-60px 0px"
                                         },ed);
            break;
          case "subscript":
            cntrl = wysiwyg.Controls.createButton(cntrlNm,{
                                         "icon":"",
                                         "class":"sprite",
                                         "css":"background-position:-15px 0px"
                                         },ed);
            break;
          case "superscript":
            cntrl = wysiwyg.Controls.createButton(cntrlNm,{
                                         "icon":"",
                                         "class":"sprite",
                                         "css":"background-position:0px 0px"
                                         },ed);
            break;
          case "undo" :
            cntrl = wysiwyg.Controls.createButton(cntrlNm,{
                                         "icon":"",
                                         "class":"sprite",
                                         "css":"background-position:-93px 0",
                                         func:this._undo
                                         },ed);
            break;
          case "redo" :
            cntrl = wysiwyg.Controls.createButton(cntrlNm,{
                                         "icon":"",
                                         "class":"sprite",
                                         "css":"background-position:-77px 0",
                                         func:this._redo
                                         },ed);
            break;
          case "fullscreen" :
            cntrl = wysiwyg.Controls.createButton(cntrlNm,{
                                         "icon":"",
                                         "class":"sprite",
                                         "css":"background-position:-169px 0",
                                         func:this.fullScreen,
                                         tip:"View Fullscreen"
                                        },ed);

            $(window).bind("scroll.cmwysi",this._scrolling);
            $(window).bind("resize.cmwysi",this._resizing);
            break;
          case "unlink" :
            cntrl=wysiwyg.Controls.createButton(cntrlNm,{
                                       "icon":"",
                                       "class":"sprite",
                                       "css":"background-position:-150px 0",
                                       func:this.removeAnchor},ed);
            break;
          case "horizontalrule" :
            cntrl = wysiwyg.Controls.createButton("inserthorizontalrule", {
                                         "icon":"",
                                         "class":"sprite",
                                         "css":"background-position:-187px 0",
                                         tip:"Insert Horizontal Rule"},ed);
            break;
          case "createLink" :
            cntrl = wysiwyg.Controls.createDialog(cntrlNm,
                                    {"icon":iconbase+cntrlNm+".png",
                                     width:"200",
                                     height:"160",
                                     title:"Add a link",
                                     bgPos:"-111px 0px",
                                     message:{
                                      html:"Text: <input type='text' name='text' value='' /><br />"+
                                           "Link: <input type='text' name='link' value='' />" },
                                      callback:"wysiwyg.packages.basic.insertLink",
                                      dynamicContent:"wysiwyg.packages.basic.dynamicContent"
                                     },ed);

            $.extend(wysiwyg.context.definitions["*"], {"Create/Edit Link":{name:"create",cmd:"$(wysiwyg.active.element).prev().find(\".toolbar .createLink\").click();"}});
            break;
          case "html" :
            cntrl = wysiwyg.Controls.createButton(cntrlNm,{
                                         "icon":"",
                                         "class":"sprite",
                                         "css":"background-position:-204px 0",
                                         tip:"View Code",
                                         func:this.showSource},ed);
            break;
          default:
            break;
        }
        if (cntrl!=null) {
          $(toolUL).append(cntrl)
        }
      }
      wysiwyg.ToolbarManager.AddList(ed,toolUL);
    },
    _nodechange : function(j,src,ev) {
      if ( src.nodeName.toLowerCase() === "a") {
        $(wysiwyg.active.toolbar.element)
          .find(".createLink")
          .addClass("sprite")
          .css("background-position","-131px 0");
      } else {
        $(wysiwyg.active.toolbar.element)
          .find(".createLink")
          .addClass("sprite")
          .css("background-position","-111px 0px");
      }

      if($(src).css("font-weight")=="bold"){
        $(j.toolbar.element).find(".bold").parent().addClass("active");
      } else {  $(j.toolbar.element).find(".bold").parent().removeClass("active"); }
      if($(src).css("font-style")=="italic"){
        $(j.toolbar.element).find(".italic").parent().addClass("active");
      } else {  $(j.toolbar.element).find(".italic").parent().removeClass("active"); }
      if(src.style.textDecoration=="underline"){
        $(j.toolbar.element).find(".underline").parent().addClass("active");
      } else {  $(j.toolbar.element).find(".underline").parent().removeClass("active"); }
      if($(src).is("sup")||$(src).parent("sup").length>0){
        $(j.toolbar.element).find(".superscript").parent().addClass("active");
      } else { $(j.toolbar.element).find(".superscript").parent().removeClass("active"); }
      if($(src).is("sub")||$(src).parent("sub").length>0){
        $(j.toolbar.element).find(".subscript").parent().addClass("active");
      } else { $(j.toolbar.element).find(".subscript").parent().removeClass("active"); }
      return true;
    },
    _italic:function(t) {
      t.ActionManager.snap(t);
      if(t.selection.node.nodeName.toLowerCase()=="body"&&t.selection.type==="#text") {
        wysiwyg.selection.replaceSelection("<span style='font-style:italic;'>"+t.selection.text+"</span>",t);
      } else {
        $(t.selection.node).css("font-style","italic");
      }
    },
    _bold:function(t) {
      t.ActionManager.snap(t);
      if(t.selection.node.nodeName.toLowerCase()=="body"&&t.selection.type==="#text") {
        wysiwyg.selection.replaceSelection("<span style='font-weight:bold;'>"+t.selection.text+"</span>",t);
      } else {
        $(t.selection.node).css("font-weight","bold");
      }
    },
    removeAnchor : function() {
      var t = wysiwyg.active;
      if( (! t.selection.fullNode()) && (t.selection.parent.nodeName.toLowerCase() == "a") ) {
        t.selection.selectFull();
      }
      t.wysiDoc.execCommand("unlink",false, {});
    },
    fullScreen : function(ed) {
      var w=wysiwyg;
      var t=w.editors[ed.element.id];
      var toolbar = $(t.iframe).prev();
      var statusbar = $(t.iframe).next();

      if(ed.element.id!="fullscreen"){
        var fullscreenEd = $("<textarea/>");
        $(fullscreenEd).attr("display","none").attr("id","fullscreen");
        $("body").append(fullscreenEd);
        var fullEd=w.API.create("fullscreen",fullscreenEd,$.extend(t.opts,{resizable:"false"}));

        $(fullEd.iframe)
          .parent()
          .css({
            width:"100%",
            height:$(window).height(),
            position:"absolute",
            left:0,
            top:$(top.window).scrollTop(),
            "z-index":"10000",
            margin:"0px"
          })
          .end()
          .css({width:"100%"});//,height:iframeht,top:0,left:0}).parent().css({"position":"absolute",width:$(top.window).width(),top:$(top.window).scrollTop(),left:0,"z-index":"10000",margin:"0px"});

        var iframeht;
        if ($(fullEd.iframe).parent().height()>$(window).height()) {
          iframeht=$(window).height()-$(fullEd.toolbar.element).height()-$(statusbar).height();
        } else {
          iframeht=$(fullEd.iframe).parent().height()-$(fullEd.toolbar.element).height()-$(statusbar).height();
        }

        $(fullEd.iframe).css({height:iframeht})

        $(fullEd.wysiDoc)
          .find("body")
          .html($(t.wysiDoc).find("body").html());

        if(typeof wysiwyg.fullscreen=="undefined"){
          wysiwyg["fullscreen"]={};
        }

        wysiwyg.fullscreen["using"]=ed.element.id;
        $(fullscreenEd).show();
      } else {
        $(wysiwyg.editors[wysiwyg["fullscreen"]["using"]].wysiDoc).find("body").html($(wysiwyg.editors["fullscreen"].wysiDoc).find("body").html());
        wysiwyg.API.remove("fullscreen");
        wysiwyg.API.update(w.fullscreen.using);
      }
    },
    _undo:function(t){
      t.ActionManager.undo(t);
    },
    _redo:function(t){t.ActionManager.redo(t);},
    _scrolling:function(){
      var top = (typeof window.pageYOffset!="undefined")?window.pageYOffset:document.documentElement.scrollTop;
      $(".cmwysi-fullscreen").css("top",top);
    },
    _resizing:function(){
      var t = wysiwyg
      var toolbar = $(t.iframe).prev();
      var statusbar = $(t.iframe).next();
      if (!t.isFull) return;
      var iframeht = $(window).height()-$(toolbar).height()-($(statusbar).height()*2);
      $(t.iframe)
        .css({width:"100%",height:iframeht})
        .parent().css({width:$(window).width()});
    },
    dynamicContent : function(ev,ed) {
      if(!ed.selection.node.nodeName) {
        return;
      }
      if ((wysiwyg.packages.basic.checkForAnchor)&&(ed.selection.parent.nodeName.toLowerCase()=="a")) {
        $("#dialog input[name='text']").val($(ed.selection.parent).text());
        $("#dialog input[name='link']").val($(ed.selection.node).attr("href"));

        ed.selection.selectFull(ed.selection.parent,ed);
        ed.selection.setSelection(ed.selection.parent);
      } else {
        $("#dialog input[name='text']").val(ed.selection.text);
        if(ed.selection.node.nodeName.toLowerCase()=="a"){$("#dialog input[name='link']").val($(ed.selection.node).attr("href"));}
        else{$("#dialog input[name='link']").val("");}
      }
    },
    insertLink : function() {
      var w = wysiwyg;
      var t = w.active;

      var link=$("#dialog").find("input[name='link']").val();
      var text=$("#dialog").find("input[name='text']").val();

      if (typeof t.selection.obj.pasteHTML=="function"){
        //IE
        var doc=t.iframe[0].contentWindow.document
        html=doc.selection.createRange();
        t.selection.obj.pasteHTML("<a href='"+link+"' title=''>"+text+"</a>");
      } else {
        //FF...
        t.wysiDoc.execCommand("insertHTML",false,"<a href='"+link+"' title=''>"+text+"</a>");
      }
    },
    showSource:function(ed) {
      var w=wysiwyg,iframe, doc, srcArea, t;
      t=w.editors[$(ed.element).attr("id")];
      iframe=t.iframe;
      doc=t.wysiDoc;
      
      srcArea = $(".srcViewTxtArea");
      if (srcArea.length===0){
        srcArea = $("<textarea />")
            					.height($(iframe).height())
            					.width($(iframe).width())
             					.addClass("srcViewTxtArea")
             					.insertBefore(iframe);
      }      					
      $(srcArea).show();
      $(iframe).hide();

      if (! t.htmlView) {
        //Disable all the other buttons, they are no good in Source View.
      	$(".toolbar")
      		.find("[class^='package-']:not(:has(li.control-html))").hide()
      		.end()
      		.find("[class='package-basic'] li:not(.control-html)").hide();

        $(srcArea).val(doc.body.innerHTML);

        t.htmlView=true;
        t.active=false;
      } else {
        //Enable the other buttons again.
      	$(".toolbar")
      		.find("[class^='package-']:not(:has(li.control-html))").show()
			    .end()
			    .find("[class='package-basic'] li:not(.control-html)").show();

        doc.body.innerHTML = $(".srcViewTxtArea").val();
        $(iframe).show();
        $(".srcViewTxtArea").hide();

        t.active=true;
        t.htmlView=false;
      }

      return false;
    }
  };

  wysiwyg.nodechanges.push(wysiwyg.packages.basic._nodechange);
  $.each(wysiwyg.editors,function(){
    this["isFull"]=false;
    this["htmlView"]=false,
    wysiwyg["fullscreen"]={};
  });
})(jQuery);

plugin.basic*/
