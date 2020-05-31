(function () {
  var help = null;
  var config = null;
  var status = null;
  var $initdata = {
    auth: false
  };
  var $f = {
    status: _status,
    config: _config,
    logs: _logs,
    help: _help
  };
  var $update = function() {
    $.getJSON('/auth').then(function (res) {
      if (res.user) {
        setTimeout($update, 60000);
      } else {
        location.replace('/login');
      }
    }).catch(function (err) {
      console.log(err);
      setTimeout($update, 60000);
    });
  };

  $(function() {
    if ($('#init').length) {
      var data = $('#init').attr('data-init');
      if (data && data.length && data.indexOf('{') === 0) {
        try {
          Object.assign($initdata, JSON.parse(data));
        } catch (e) {
          console.log('*[initdata parse error]', e);
        }
      }
    }
    if (!$initdata.user) return;
    setTimeout(function() {
      _status();
    }, 100);
    setTimeout($update, 60000);
    $('#a_start').click(function (event) {
      event.preventDefault();
      $.get('/start').then(function (res) {
        $('#c_status').html(res);
        if (res.indexOf('started') !== -1) {
          $('#status_label').html('RUNNING');
        }
        $('#a_start').hide();
        $('#a_stop').show();
      }).catch(function (err) {
        console.log('*[error]', err);
      });
      return false;
    });
    $('#a_stop').click(function (event) {
      event.preventDefault();
      $.get('/stop').then(function (res) {
        $('#c_status').html(res);
        if (res.indexOf('stopped') !== -1) {
          $('#status_label').html('STOPPED');
        }
        $('#a_stop').hide();
        $('#a_start').show();
      }).catch(function (err) {
        console.log('*[error]', err);
      });
      return false;
    });
    $('#a_backup').click(function (event) {
      event.preventDefault();
      window.open('/backup');
    });
    $('#a_restartapp').click(function (event) {
      event.preventDefault();
      $.get('/restartapp').then(function (res) {
        $('body').html('<div class="container"><div class="row justify-content-center align-items-center" style="height:100vh">Restarting application...</div></div>');
        setTimeout(function() {
          location.replace('/login');
        }, 5000);
      }).catch(function (err) {
        console.log('*[error]', err);
      });
    });
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
      if (e && e.target) {
        var id = e.target.getAttribute('aria-controls');
        if (id) {
          $f[id] && $f[id]();
        }
      }
    });
  })

  function _status(cb) {
    if (status) return;
    $('#world_name').text('');
    $('#world_label').hide();
    $.getJSON('/stats').then(function (res) {
      status = res;
      config = res.configFile;
      $('#world_name').text(res.world);
      $('#world_label').show();
      if (res.worlds && res.worlds.length) {
        $('#worldslist').empty();
        res.worlds.forEach(function(wld) {
          $('#worldslist').append('<li>' + wld + '</li>');
        });
      }
      setTimeout(function() { status = null; }, 10000);
      cb && cb(res);
    }).catch(function (err) {
      console.log('*[error]', err);
    })
  }
  
  function _config() {
    var content = $('#app-config-content').html();
    if (content === '') {
      $.get('/config').then(function (res) {
        $('#app-config-content').html(res);
      }).catch(function (err) {
        console.log('*[error]', err);
      });
    }
    if (config) {
      $('#config-content').html(config);
      return;
    }
    _status(function(res) {
      config = res.configFile;
      $('#config-content').html(config);
      setTimeout(function() { config = null; }, 60000);
    })
  }

  function _logs() {
    $.get('/logs').then(function (res) {
      $('#logs-content').html(res);
    }).catch(function (err) {
      console.log('*[error]', err);
    })
  }
  
  function _help() {
    if (help) return;
    $.get('/help').then(function (res) {
      help = res;
      $('#help-content').html(res);
    }).catch(function (err) {
      console.log('*[error]', err);
    })
  }
})();
