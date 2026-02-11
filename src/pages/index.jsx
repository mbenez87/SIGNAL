import Layout from "./Layout.jsx";

import AboutUs from "./AboutUs";

import AuditLogs from "./AuditLogs";

import Billing from "./Billing";

import Compliance from "./Compliance";

import Dashboard from "./Dashboard";

import DocumentViewer from "./DocumentViewer";

import DocumentAnalysis from "./DocumentAnalysis";

import Documents from "./Documents";

import Home from "./Home";

import Intelligence from "./Intelligence";

import MichaelBenezra from "./MichaelBenezra";

import MichaelChavira from "./MichaelChavira";

import Permissions from "./Permissions";

import Pricing from "./Pricing";

import Privacy from "./Privacy";

import SavedChats from "./SavedChats";

import SubscriptionSettings from "./SubscriptionSettings";

import Terms from "./Terms";

import Trash from "./Trash";

import Upload from "./Upload";

import Workspaces from "./Workspaces";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    AboutUs: AboutUs,
    
    AuditLogs: AuditLogs,
    
    Billing: Billing,
    
    Compliance: Compliance,
    
    Dashboard: Dashboard,
    
    DocumentViewer: DocumentViewer,
    
    DocumentAnalysis: DocumentAnalysis,

    Documents: Documents,
    
    Home: Home,
    
    Intelligence: Intelligence,
    
    MichaelBenezra: MichaelBenezra,
    
    MichaelChavira: MichaelChavira,
    
    Permissions: Permissions,
    
    Pricing: Pricing,
    
    Privacy: Privacy,
    
    SavedChats: SavedChats,
    
    SubscriptionSettings: SubscriptionSettings,
    
    Terms: Terms,
    
    Trash: Trash,
    
    Upload: Upload,
    
    Workspaces: Workspaces,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<AboutUs />} />
                
                
                <Route path="/AboutUs" element={<AboutUs />} />
                
                <Route path="/AuditLogs" element={<AuditLogs />} />
                
                <Route path="/Billing" element={<Billing />} />
                
                <Route path="/Compliance" element={<Compliance />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/DocumentViewer" element={<DocumentViewer />} />
                
                <Route path="/DocumentAnalysis" element={<DocumentAnalysis />} />

                <Route path="/Documents" element={<Documents />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Intelligence" element={<Intelligence />} />
                
                <Route path="/MichaelBenezra" element={<MichaelBenezra />} />
                
                <Route path="/MichaelChavira" element={<MichaelChavira />} />
                
                <Route path="/Permissions" element={<Permissions />} />
                
                <Route path="/Pricing" element={<Pricing />} />
                
                <Route path="/Privacy" element={<Privacy />} />
                
                <Route path="/SavedChats" element={<SavedChats />} />
                
                <Route path="/SubscriptionSettings" element={<SubscriptionSettings />} />
                
                <Route path="/Terms" element={<Terms />} />
                
                <Route path="/Trash" element={<Trash />} />
                
                <Route path="/Upload" element={<Upload />} />
                
                <Route path="/Workspaces" element={<Workspaces />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}