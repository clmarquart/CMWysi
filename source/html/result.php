<?php echo "<?xml version=\"1.0\" encoding=\"utf-8\"?>"; ?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
   "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html>
<head>
  <title>Test Cmwysi Submission</title>
</head>
<body>
  <a href="index.html" alt="Back to Cmwysi">Back</a><br />
  <pre>
    <?php echo urldecode($_POST['cmwysi']); ?>
  </pre>
  <pre>
    <?php echo urldecode($_POST['cmwysi2']); ?>
  </pre>
</body>
</html>