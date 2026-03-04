---
layout: page
title: Writing
description: Scientific and philosophical essays with long-form analysis.
permalink: /writing/
---
<div class="projects-grid">
  {% assign sorted_writing = site.writing | sort: "date" | reverse %}
  {% for post in sorted_writing %}
    {% include card-writing.html post=post %}
  {% endfor %}
</div>
