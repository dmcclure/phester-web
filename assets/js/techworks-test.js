
$(document).ready(function () {

  var questionIds = [];
  var questionEditors = [];

  // Show the username and a random wavatar
  var username = $.cookie('phester_username');
  $('#username').text(username);
  $('#avatar').attr('src', 'http://www.gravatar.com/avatar/' + CryptoJS.MD5(username) + '?d=wavatar');

  // Fetch the questions from the server
  showLoader('Loading questions');
  $.ajax({
    url: 'http://localhost:9001/api/questions',
    type: 'GET',
    dataType: 'json',
    encode: true,

    success: function (data, textStatus, jqXHR) {
      for (var i = 0; i < data.length; i++) {
        initQuestion(data[i], i);
      }
    },

    error: function (jqXHR, textStatus, errorThrown) {
      if (errorThrown) {
        $('#error-msg').text(errorThrown);
      }
      else {
        $('#error-msg').text(textStatus);
      }

      $('#error-modal').modal({ show: true });
    },

    complete: function() {
      hideLoader();
    }
  });

  function initQuestion(question, index) {
    questionIds.push(question.id);

    // Add a new tab
    var questionNum = index + 1;

    var tabHtml = '<li';
    if (questionNum == 1) {
      tabHtml += ' class="active"';
    }
    tabHtml += '><a href="#question' + questionNum + '" role="tab" data-toggle="tab">Question ' + questionNum + '</a></li>';
    $('#question-tabs').append(tabHtml);

    var tabContent = $('#question-content-to-clone').clone();
    tabContent.attr('id', 'question' + questionNum);
    tabContent.removeAttr('style');
    tabContent.find('.question-name :first').text('Question ' + questionNum + ': ' + question.name);
    tabContent.find('.question-task :first').text(question.question);

    var inputOutput = tabContent.find('.question-input-output :first');
    for (var i = 0; i < question.sampleInput.length; i++) {
      if (i > 0) {
        inputOutput.append('<div class="col-sm-12"><hr></div>');
      }

      var inputHtml = '<div class="col-sm-6 col-xs-6 goleft"><p>Input:</p></div><div class="col-sm-6 col-xs-6"><p>';
      inputHtml += question.sampleInput[i].input;
      inputHtml += '</p></div><div class="col-sm-6 col-xs-6 goleft"><p>Output:</p></div><div class="col-sm-6 col-xs-6"><p>';
      inputHtml += question.sampleInput[i].output;
      inputHtml += '</p></div>';
      inputOutput.append(inputHtml);
    }

    var editor = tabContent.find('.editor :first');
    // Give the editor a unique ID
    editor.attr('id', 'question-editor-' + question.id);
    editor.text(question.starterCode);

    // Init the Ace editor
    var aceEditor = ace.edit(editor[0]);
    aceEditor.setTheme("ace/theme/dawn");
    aceEditor.getSession().setMode("ace/mode/php");
    questionEditors.push(aceEditor);

    // Setup the "Run my code" button
    tabContent.find('button :first').click(function (e) {
      runCode(question.id, aceEditor.getValue());
    });

    // Give the output section a unique ID
    tabContent.find('.question-output :first').attr('id', 'question-output-' + question.id);

    // Make the first question active by default
    if (index == 0) {
      tabContent.addClass('active');
    }

    $('#question-tabs-content').append(tabContent);

    // Make the tab clickable
    $('#question' + questionNum + ' a').click(function (e) {
      e.preventDefault();
      if (index == 0) {
        $(this).tab('show')
      }
    });

  }

  function showLoader(text) {
    $('body').waitMe({
      effect: 'win8',  //none, rotateplane, stretch, orbit, roundBounce, win8, win8_linear, ios, facebook, rotation, timer, pulse.
      text: text || '',             //place text under the effect (string).
      bg: 'rgba(255,255,255,0.7)',  //background for container (string).
      color: '#000',                //color for background animation and text (string).
      sizeW: '',                    //change width for elem animation (string).
      sizeH: ''                     //change height for elem animation (string).
    });
  }

  function hideLoader() {
    $('body').waitMe('hide');
  }

  // Send the code to the server to run and handle the result
  function runCode(questionId, code) {
    var data = {
      questionId: questionId,
      code: code
    };

    showLoader('Running your code');
    $.ajax({
      url: 'http://localhost:9001/api/run',
      type: 'POST',
      dataType: 'json',
      data: data,
      encode: true,

      success: function (data, textStatus, jqXHR) {
        $('#question-output-' + questionId).text(data.output);

        if (data.success) {
          //$('#question-output-' + questionId).css('background-color', '#f5f5f5');
          $('#question-output-' + questionId).addClass('alert-success').removeClass('alert-danger');
        }
        else {
          $('#question-output-' + questionId).addClass('alert-danger').removeClass('alert-success');
          //$('#question-output-' + questionId).css('background-color', '#f2dede');
          //$('#question-output-' + questionId).css('border-color', '#ebccd1');
          //$('#question-output-' + questionId).css('color', '#a94442');
        }
      },

      error: function (jqXHR, textStatus, errorThrown) {
        if (errorThrown) {
          $('#error-msg').text(errorThrown);
        }
        else {
          $('#error-msg').text(textStatus);
        }

        $('#error-modal').modal({ show: true });
      },

      complete: function() {
        hideLoader();
      }
    });
  }

  // Submit test button
  $('#submit-button').click(function (e) {
    $('#submit-modal').modal({ show: true });
  });

  // Submit test confirm
  $('#submit-button-confirm').click(function (e) {
    var data = { questions: [] };

    for (var i = 0; i < questionIds.length; i++) {
      data.questions.push({
        questionId: questionIds[i],
        code: questionEditors[i].getValue()
      });
    }
    console.log('data', data);

    showLoader('Submitting test');
    $.ajax({
      url: 'http://localhost:9001/api/submit',
      type: 'POST',
      dataType: 'json',
      data: data,
      encode: true,

      success: function (data, textStatus, jqXHR) {
        window.location = 'done.html';
      },

      error: function (jqXHR, textStatus, errorThrown) {
        if (errorThrown) {
          $('#error-msg').text(errorThrown);
        }
        else {
          $('#error-msg').text(textStatus);
        }

        $('#error-modal').modal({ show: true });
      },

      complete: function() {
        hideLoader();
      }
    });
  });

//        var unique_id = $.gritter.add({
//            // (string | mandatory) the heading of the notification
//            title: 'Welcome to Dashgum!',
//            // (string | mandatory) the text inside the notification
//            text: 'Hover me to enable the Close Button. You can hide the left sidebar clicking on the button next to the logo. Free version for <a href="http://blacktie.co" target="_blank" style="color:#ffd777">BlackTie.co</a>.',
//            // (string | optional) the image to display on the left
//            image: 'assets/img/ui-sam.jpg',
//            // (bool | optional) if you want it to fade out on its own or just sit there
//            sticky: true,
//            // (int | optional) the time you want it to be alive for before fading out
//            time: '',
//            // (string | optional) the class name you want to apply to that specific message
//            class_name: 'my-sticky-class'
//        });

});
