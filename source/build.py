#! /usr/bin/python

import os
import os.path
import shutil

__author__="Cody Marquart"
__date__ ="$Dec 2, 2009 9:44:00 PM$"

root = os.path.abspath("..")
buildDir = root+"/build"
source = root+"/source"
cmwysiDir = buildDir+"/cmwysi"
demoDir   = buildDir+"/demo"
toCombine = ['basic','format','images','style','table']

def cleanBuild():
  print "Cleaning..."
  os.chdir(root)

  shutil.rmtree(buildDir,'true')

def makeBuild():
  print "Making Dir..."
  os.mkdir(buildDir,0777)
  os.mkdir(cmwysiDir,0777)
  os.mkdir(cmwysiDir+"/plugins",0777)
  #os.mkdir(demoDir,0777)
  os.chdir(source)

def readFile(file):
  in_file = open(file, "r")
  text = in_file.read()
  in_file.close()

  return text

def saveFile(name,contents):
  out_file = open(name, "a")
  out_file.write(contents)
  out_file.close()

all = ""
def listFiles(dir):
  basedir = dir

  subdirlist = []
  for item in os.listdir(dir):
    if os.path.isdir(os.path.join(basedir,item)):
      subdirlist.append(os.path.join(basedir, item))
    else:
      if os.path.splitext(item)[1] == ".js":
        pluginName = basedir.rpartition("/")[2]
        if pluginName in toCombine:
          print pluginName + " should be saved."
          saveFile(cmwysiDir+"/plugins/plugins.js","/*plugin."+pluginName+"\n"+readFile(os.getcwd()+"/plugins/"+pluginName+"/plugin.js")+"\nplugin."+pluginName+"*/\n")
        else:
          print pluginName + " is indvidual file."
          os.mkdir(cmwysiDir+"/plugins/"+pluginName)
          shutil.copyfile(os.getcwd()+"/plugins/"+pluginName+"/plugin.js",cmwysiDir+"/plugins/"+pluginName+"/plugin.js")

  for subdir in subdirlist:
    listFiles(subdir)

def combinePlugins():
  print "Build plugins..."
  listFiles(os.getcwd()+"/plugins/")

#  print all
#  saveFile(cmwysiDir+"\\plugins\\plugins.js",all)

def testBuild():
  print os.path.exists(buildDir)
  print os.path.exists(cmwysiDir+"/plugins")
  print os.path.exists(cmwysiDir+"/extras")
  print os.path.exists(buildDir+"/html")

cleanBuild()
makeBuild()
combinePlugins()

os.chdir(source)

shutil.copytree(source+"/html",demoDir)
shutil.copyfile(source+"/main/jquery.cmwysi.js",cmwysiDir+"/jquery.cmwysi.js")
shutil.copyfile(source+"/main/jquery.cmwysi.css",cmwysiDir+"/jquery.cmwysi.css")
shutil.copyfile(source+"/main/jquery.dialog.css",cmwysiDir+"/jquery.dialog.css")
shutil.copytree(source+"/extras",cmwysiDir+"/extras")
shutil.copytree(source+"/images",cmwysiDir+"/images")
shutil.copytree(source+"/plugins/basic/images",cmwysiDir+"/plugins/basic/images")

print "Done building..."

testBuild()

