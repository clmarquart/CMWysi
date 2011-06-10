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
