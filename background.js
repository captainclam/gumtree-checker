app = (function() {

  var parseResponse = function(data) {
  	var topAds = data.find('#srchrslt-adtable-topads li');
  	var mainAds = data.find('#srchrslt-adtable li');

  	var topAdsContent = extractContent(topAds);
  	var allPageContent = topAdsContent.concat(extractContent(mainAds));
  	findNewAds(allPageContent);
  }

  var getLocalAds = function() {
  	var allAdsString = localStorage.getItem('ads');
  	var allAds = [];
  	if (allAdsString != null && allAdsString.length > 0) {
  		allAds = JSON.parse(allAdsString);
  	}
  	return allAds;
  }

  var findNewAds = function(allPageContent) {
  	var allAds = getLocalAds();
  	var deleteAds = [];
  	for(var x in allAds) {
  		for(var y in allPageContent) {
  			var storedAd = allAds[x];
  			var newAd = allPageContent[y];
  			if (storedAd.link == newAd.link) {
  				deleteAds.push(newAd);
  			}
  		}
  	}

  	var leftOverAds = allPageContent.remove(deleteAds);
  	
  	leftOverAds = leftOverAds.sort(function(a, b) {
  	
  		if (a.timestamp < b.timestamp) {
  			return 1;
  		} else if (a.timestamp > b.timestamp) {
  			return -1;
  		} else {
  			return 0;
  		}
  	});
  	
  	desktopNotifyAds(leftOverAds);
  	storeAds(leftOverAds);
  }

  var desktopNotifyAds = function(ads) {
  	$(ads).each(function() {
  		var ad = this;
  		var price = ad.price;
  		
  		// filter by price
  		if ((!isNaN(minPrice) && price < minPrice) || (!isNaN(maxPrice) && price > maxPrice)) {
  		
  		} else {
  			
  			price = ((typeof(price) == 'number') ? '$' + price : price);
  			var newTitle =  price + ' ' + ad.title;
  			
  			// get correct icon
  			var icon = gumtreeIconURL;
  			
  			if (ad.title.toLowerCase().indexOf('iphone') != -1) {
  				icon = iphoneIconURL;
  			} else if (ad.title.toLowerCase().indexOf('galaxy') != -1) {
  				icon = galaxyS3IconURL;
  			}
  			
  			var timeAgo = $.timeago(ad.post_time);
  			
  			notification = window.webkitNotifications.createNotification(icon, newTitle, timeAgo);
  			var windowUrl = ad.link;
  			notification.onclick = function() {
  				window.open(ad.link, '_blank');
  				window.focus();
  				cancel();
  			};
  			notification.show();
  		}
  	});
  }

  var storeAds = function(ads) {
  	var allAdsString = localStorage.getItem('ads');
  	var allAds = [];
  	if (allAdsString != null && allAdsString.length > 0) {
  		allAds = JSON.parse(allAdsString);
  	}

  	var combined = allAds.concat(ads);

  	var combinedString = JSON.stringify(combined);
  	localStorage.setItem('ads', combinedString);
  }

  var extractContent = function(section) {
  	var pageOfContent = [];
  	$(section).each(function(i) {
  		var item = $(this);

  		var link = item.find('.rs-ad-title');
  		var url = link.attr('href');
  		var title = link.html();
  		var price = item.find('.rs-ad-price > .h-elips').html();
  		var timeString = item.find('.rs-ad-date').html();
  		
  		// check if its a date, if it is reverse the month and year for american styles
  		
  		if (timeString.indexOf('Yesterday') != -1) {
  			timeString = '-1 day'; // fix for strtotime
  		}
  		
  		if (timeString.indexOf('/') != -1) {
  			var parts = timeString.split('/');
  			timeString = parts[1] + '/' + parts[0] + '/' + parts[2];
  		}
  		
  		var datePosted = parseInt(strtotime(timeString));
  		var timeAgo = $.timeago(datePosted * 1000);
  		
  		var itemContent = {};
  		itemContent.post_time = new Date(datePosted * 1000);
  		itemContent.timestamp = datePosted;
  		itemContent.link = 'http://www.gumtree.com.au' + url;
  		itemContent.title = html_entity_decode(title);
  		
  		if (typeof price != 'undefined' && price != null) {
  			price = price.substring(2, price.length);
  			price = parseInt(price);
  			
  			if (isNaN(price)) {
  				price = 'Negotiable';
  			}
  		} else {
  			price = 'Negotiable';
  		}
  		
  		itemContent.price = price;
  		
  		if (typeof itemContent.title != 'undefined' && itemContent.title != null && typeof itemContent.link != 'undefined' && itemContent.link != null) {
  			pageOfContent.push(itemContent);
  		}
  	});

  	return pageOfContent;
  }

  var getPages = function() {
  	$(keywordsToMonitor).each(function() {
  		var keyword = this;
  		var encodedKeyword = keyword.split(' ').join('+');
  		var url = 'http://www.gumtree.com.au/' + regionCode + '/' + encodedKeyword + '/' + endCode + '?ad=offering';
  		$.ajax({
  			method:'get',
  			url: url,
  			dataType: 'html',
  			success: function(response) {
  				response.replace(/img src/g,'img rel');
  				parseResponse($(response));
  			},
  		});
  	});
  };

  var iphoneIconURL = 'data:image/png;base64,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';
  var galaxyS3IconURL = 'data:image/png;base64,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';
  var gumtreeIconURL = 'data:image/png;base64,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';

  // configuration

  var reloadSecs = 60;

  var minPrice = 0;
  var maxPrice = 1000;

  var regionCode = 's-brisbane';
  var endCode = 'k0l3005721';

  var keywordsToMonitor = [
    'xbox',
  ];

  var interval = null;

  // publicly accessible api
  return {
    go: function() {
      interval = setInterval(getPages, reloadSecs * 1000);
    },
    stop: function() {
      clearInterval(interval);
    }
  }

})();

// start shit
app.go();
