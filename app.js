const { useState, useEffect } = React;

// --- Seed Data Generation ---
const generateSeedData = () => {
  const surveys = {};
  for (let i = 1; i <= 48; i++) {
    // default template
    let survey = {
      id: `survey_${i}`,
      display_number: i,
      title: `問卷 #${i}`,
      description: `這是第 ${i} 號問卷的預設描述。`,
      status: "not_started",
      total_questions: 1,
      questions: [
        {
          question_id: `q${i}_1`,
          type: "single_choice",
          prompt: "您對目前的網站體驗感覺如何？",
          options: [
            { label: "非常好", value: "5" },
            { label: "普通", value: "3" },
            { label: "需要改進", value: "1" }
          ],
          required: true
        }
      ]
    };

    // custom templates for PRD examples
    if (i === 7) {
      survey.title = "系統效能回饋";
      survey.description = "幫助我們了解網站的回應速度與穩定性。";
      survey.total_questions = 2;
      survey.questions = [
        {
          question_id: `q7_1`,
          type: "single_choice",
          prompt: "您覺得網站載入速度快嗎？",
          options: [
            { label: "非常快", value: "fast" },
            { label: "普通", value: "normal" },
            { label: "很慢", value: "slow" }
          ],
          required: true
        },
        {
          question_id: `q7_2`,
          type: "short_text",
          prompt: "遇到任何卡頓的情況請描述：",
          required: false
        }
      ];
    } else if (i === 12) {
      survey.title = "使用者介面滿意度調查";
      survey.description = "幫助我們了解您對 QB 光譜首頁設計的看法。";
      survey.total_questions = 2;
      survey.questions = [
        {
          question_id: `q12_1`,
          type: "single_choice",
          prompt: "您覺得 1-48 的網格設計容易閱讀嗎？",
          options: [
            { label: "非常容易", value: "5" },
            { label: "普通", value: "3" },
            { label: "不容易", value: "1" }
          ],
          required: true
        },
        {
          question_id: `q12_2`,
          type: "short_text",
          prompt: "請簡述您最喜歡的介面功能。",
          required: false
        }
      ];
    }
    
    surveys[survey.id] = survey;
  }
  return surveys;
};

// --- Components ---

const SurveyTile = ({ survey, onClick }) => {
  return (
    <div 
      className={`survey-tile status-${survey.status}`}
      onClick={() => onClick(survey.id)}
    >
      {survey.display_number}
      {survey.status === 'completed' && <span className="checkmark">✓</span>}
      <div className="tooltip">{survey.title}</div>
    </div>
  );
};

const SurveyList = ({ surveys, onSelect }) => {
  return (
    <div>
      <header>
        <h1>QB 光譜</h1>
        <p className="subtitle">問卷展示與管理系統</p>
      </header>
      <div className="survey-grid">
        {Object.values(surveys).map(survey => (
          <SurveyTile 
            key={survey.id} 
            survey={survey} 
            onClick={onSelect} 
          />
        ))}
      </div>
    </div>
  );
};

const SurveyForm = ({ survey, onBack, onSubmit }) => {
  const [answers, setAnswers] = useState({});
  
  const handleChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const isSubmitDisabled = () => {
    for (let q of survey.questions) {
      if (q.required && !answers[q.question_id]) {
        return true;
      }
    }
    return false;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitDisabled()) return;
    onSubmit(survey.id, answers);
  };

  return (
    <div className="survey-form-container">
      <button className="back-btn" onClick={onBack}>
        ← 返回列表
      </button>
      
      <h2 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>{survey.title}</h2>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>{survey.description}</p>
      
      <form onSubmit={handleSubmit}>
        {survey.questions.map((q, index) => (
          <div key={q.question_id} className="question-block">
            <div className="question-prompt">
              {index + 1}. {q.prompt}
              {q.required && <span className="required">*</span>}
            </div>
            
            {q.type === 'single_choice' && (
              <div className="options-group">
                {q.options.map(opt => (
                  <label key={opt.value} className="option-label">
                    <input 
                      type="radio" 
                      name={q.question_id}
                      value={opt.value}
                      checked={answers[q.question_id] === opt.value}
                      onChange={(e) => handleChange(q.question_id, e.target.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            )}
            
            {q.type === 'short_text' && (
              <input 
                type="text" 
                className="text-input"
                placeholder="請輸入您的回答..."
                value={answers[q.question_id] || ''}
                onChange={(e) => handleChange(q.question_id, e.target.value)}
              />
            )}
          </div>
        ))}
        
        <button type="submit" className="submit-btn" disabled={isSubmitDisabled()}>
          送出問卷
        </button>
      </form>
    </div>
  );
};

const App = () => {
  const [surveys, setSurveys] = useState({});
  const [currentRoute, setCurrentRoute] = useState(window.location.hash || '');
  const [toastMessage, setToastMessage] = useState('');

  // 初始化資料與讀取 localStorage
  useEffect(() => {
    const defaultData = generateSeedData();
    const savedData = localStorage.getItem('qb_spectrum_surveys');
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Merge with default to ensure new questions are present if schema updates
        const merged = { ...defaultData };
        for (let key in parsed) {
          if (merged[key]) {
            merged[key].status = parsed[key].status;
            merged[key].answers = parsed[key].answers || {};
          }
        }
        setSurveys(merged);
      } catch (e) {
        setSurveys(defaultData);
      }
    } else {
      setSurveys(defaultData);
    }

    // 監聽路由變化
    const handleHashChange = () => setCurrentRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 儲存至 localStorage
  useEffect(() => {
    if (Object.keys(surveys).length > 0) {
      localStorage.setItem('qb_spectrum_surveys', JSON.stringify(surveys));
    }
  }, [surveys]);

  const navigateTo = (hash) => {
    window.location.hash = hash;
  };

  const handleSelectSurvey = (id) => {
    navigateTo(`#survey/${id}`);
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSubmitSurvey = (id, answers) => {
    setSurveys(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        status: 'completed',
        answers: answers
      }
    }));
    
    showToast('🎉 問卷送出成功！');
    navigateTo('');
  };

  // Router logic
  const renderView = () => {
    if (currentRoute.startsWith('#survey/')) {
      const surveyId = currentRoute.split('/')[1];
      const survey = surveys[surveyId];
      if (survey) {
        return (
          <SurveyForm 
            survey={survey} 
            onBack={() => navigateTo('')}
            onSubmit={handleSubmitSurvey}
          />
        );
      }
    }
    
    // Default Home view
    return <SurveyList surveys={surveys} onSelect={handleSelectSurvey} />;
  };

  if (Object.keys(surveys).length === 0) return <div>載入中...</div>;

  return (
    <div className="container">
      {renderView()}
      
      <div className={`toast ${toastMessage ? 'show' : ''}`}>
        {toastMessage}
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
