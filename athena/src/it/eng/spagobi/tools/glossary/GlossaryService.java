package it.eng.spagobi.tools.glossary;

import static it.eng.spagobi.tools.glossary.util.Util.fromContentsLight;
import static it.eng.spagobi.tools.glossary.util.Util.getNumberOrNull;
import it.eng.spago.security.IEngUserProfile;
import it.eng.spagobi.analiticalmodel.document.bo.BIObject;
import it.eng.spagobi.analiticalmodel.document.dao.IBIObjectDAO;
import it.eng.spagobi.analiticalmodel.document.metadata.SbiObjects;
import it.eng.spagobi.commons.dao.DAOFactory;
import it.eng.spagobi.tools.glossary.dao.IGlossaryDAO;
import it.eng.spagobi.tools.glossary.metadata.SbiGlAttribute;
import it.eng.spagobi.tools.glossary.metadata.SbiGlContents;
import it.eng.spagobi.tools.glossary.metadata.SbiGlDocWlist;
import it.eng.spagobi.tools.glossary.metadata.SbiGlDocWlistId;
import it.eng.spagobi.tools.glossary.metadata.SbiGlGlossary;
import it.eng.spagobi.tools.glossary.metadata.SbiGlReferences;
import it.eng.spagobi.tools.glossary.metadata.SbiGlReferencesId;
import it.eng.spagobi.tools.glossary.metadata.SbiGlWlist;
import it.eng.spagobi.tools.glossary.metadata.SbiGlWlistId;
import it.eng.spagobi.tools.glossary.metadata.SbiGlWord;
import it.eng.spagobi.tools.glossary.metadata.SbiGlWordAttr;
import it.eng.spagobi.tools.glossary.metadata.SbiGlWordAttrId;
import it.eng.spagobi.utilities.exceptions.SpagoBIServiceException;
import it.eng.spagobi.utilities.rest.RestUtilities;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.mongodb.util.JSON;

@Path("/1.0/glossary")
public class GlossaryService {

	@POST
	@Path("/ModifyContentsGlossary")
	@Produces(MediaType.APPLICATION_JSON)
	public String ModifyContentsGlossary(@Context HttpServletRequest req) {
		try {
			System.out.println("ModifyContentsGlossary");
			IGlossaryDAO dao = DAOFactory.getGlossaryDAO();
			IEngUserProfile profile = (IEngUserProfile) req.getSession()
					.getAttribute(IEngUserProfile.ENG_USER_PROFILE);
			// TODO check if profile is null
			dao.setUserProfile(profile);
			System.out.println(req.toString());
			JSONObject requestVal = RestUtilities.readBodyAsJSONObject(req);
			JSONObject jo = new JSONObject();

			if (requestVal.has("CONTENT_ID")) {
				// modify content (logical node)
				Integer contentId = getNumberOrNull(requestVal
						.opt("CONTENT_ID"));
				Integer parentId = getNumberOrNull(requestVal.opt("PARENT_ID"));
				Integer glossaryId = getNumberOrNull(requestVal
						.opt("GLOSSARY_ID"));
				boolean status = dao.modifyContentPosition(contentId, parentId,
						glossaryId);
				if (!status) {
					jo.put("Status", "NON OK");
					jo.put("Message", "sbi.glossary.content.duplicate.content");
					return jo.toString();
				}
			} else {
				// modify word
				Integer wordId = getNumberOrNull(requestVal.opt("WORD_ID"));
				Integer parentId = getNumberOrNull(requestVal.opt("PARENT_ID"));
				Integer oldparentId = getNumberOrNull(requestVal
						.opt("OLD_PARENT_ID"));

				SbiGlWlist contw = new SbiGlWlist();
				contw.setId(new SbiGlWlistId(wordId, parentId));

				SbiGlWlistId id = dao.insertWlist(contw);
				if (id == null) {
					jo.put("Status", "NON OK");
					jo.put("Message", "sbi.glossary.content.duplicate.node");
					return jo.toString();

				}

				dao.deleteWlist((new SbiGlWlistId(wordId, oldparentId)));

			}

			jo.put("Status", "OK");
			return jo.toString();
		} catch (Throwable t) {
			throw new SpagoBIServiceException(req.getPathInfo(),
					"An unexpected error occured while executing service", t);
		}
	}

	@POST
	@Path("/addGlossary")
	@Produces(MediaType.APPLICATION_JSON)
	public String addGlossary(@Context HttpServletRequest req) {
		JSONObject jo = new JSONObject();
		try {
			System.out.println("addGlossary");
			IGlossaryDAO dao = DAOFactory.getGlossaryDAO();
			IEngUserProfile profile = (IEngUserProfile) req.getSession()
					.getAttribute(IEngUserProfile.ENG_USER_PROFILE);
			// TODO check if profile is null
			dao.setUserProfile(profile);
			JSONObject requestVal = RestUtilities.readBodyAsJSONObject(req);

			if (((String) requestVal.opt("GLOSSARY_NM")).trim().isEmpty()) {
				jo.put("Status", "NON OK");
				jo.put("Message", "sbi.glossary.empty.glossary.name");
				return jo.toString();
			}

			jo.put("Status", "OK");
			// check if name is present
			String gn = (String) requestVal.opt("GLOSSARY_NM");
			if (gn.trim().isEmpty()) {
				// throw new SpagoBIServiceException(req.getPathInfo(),
				// "Glossary name is request");
				jo.put("Status", "NON OK");
				jo.put("Message", "sbi.glossary.new.name.request");
				return jo.toString();

			}

			SbiGlGlossary gloss;
			List<SbiGlGlossary> lg = dao.loadGlossaryByName((String) requestVal
					.opt("GLOSSARY_NM"));

			if (((String) requestVal.opt("SaveOrUpdate")).compareTo("Save") == 0) {
				// check if there is another glossary with the same name
				if (!lg.isEmpty()) {
					// throw new SpagoBIServiceException(req.getPathInfo(),
					// "Glossary Name already defined");
					jo.put("Status", "NON OK");
					jo.put("Message", "sbi.glossary.new.name.duplicate");
					return jo.toString();
				}

				gloss = new SbiGlGlossary();
			} else {
				// >1 because currently there is only the gloss that I want to
				// change
				if (lg.size() > 1) {
					jo.put("Status", "NON OK");
					jo.put("Message", "sbi.glossary.new.name.duplicate");
					return jo.toString();
				}
				gloss = dao.loadGlossary((Integer) requestVal
						.opt("GLOSSARY_ID"));
			}

			gloss.setGlossaryNm((String) requestVal.opt("GLOSSARY_NM"));
			gloss.setGlossaryCd((String) requestVal.opt("GLOSSARY_CD"));
			gloss.setGlossaryDs((String) requestVal.opt("GLOSSARY_DS"));

			if (((String) requestVal.opt("SaveOrUpdate")).compareTo("Save") == 0) {
				Integer id = dao.insertGlossary(gloss);
				jo.put("id", id);
			} else {
				dao.modifyGlossary(gloss);
			}

			return jo.toString();

		} catch (Throwable t) {
			// throw new SpagoBIServiceException(req.getPathInfo(),
			// "An unexpected error occured while executing service", t);
			try {
				jo.put("Status", "NON OK");
				jo.put("Message", "sbi.glossary.error.save");
				jo.put("Error_text", t.getCause().getCause().getMessage());
			} catch (JSONException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}

			return jo.toString();
		}
	}

	@POST
	@Path("/addContents")
	@Produces(MediaType.APPLICATION_JSON)
	public String addContents(@Context HttpServletRequest req) {
		JSONObject jo = new JSONObject();

		try {
			System.out.println("addContents");
			IGlossaryDAO dao = DAOFactory.getGlossaryDAO();
			IEngUserProfile profile = (IEngUserProfile) req.getSession()
					.getAttribute(IEngUserProfile.ENG_USER_PROFILE);
			// TODO check if profile is null
			dao.setUserProfile(profile);
			JSONObject requestVal = RestUtilities.readBodyAsJSONObject(req);

			Integer id;
			List<SbiGlContents> lg = dao.loadContentsByName((String) requestVal
					.opt("CONTENT_NM"));

			if (requestVal.has("SaveOrUpdate")) {
				if (((String) requestVal.opt("SaveOrUpdate"))
						.compareTo("Update") == 0) {
					// update contents (logical node)
					if (lg.size() > 1) {
						// throw new SpagoBIServiceException(req.getPathInfo(),
						// "content Name already defined");
						jo.put("Status", "NON OK");
						jo.put("Message",
								"sbi.glossary.content.duplicate.content");
						return jo.toString();
					}
					Integer contentId = getNumberOrNull(requestVal
							.opt("CONTENT_ID"));
					SbiGlContents cont = dao.loadContents(contentId);
					cont.setContentNm((String) requestVal.opt("CONTENT_NM"));
					cont.setContentCd((String) requestVal.opt("CONTENT_CD"));
					cont.setContentDs((String) requestVal.opt("CONTENT_DS"));
					dao.modifyContents(cont);
					jo.put("Status", "OK");
					return jo.toString();
				} else {
					if (!lg.isEmpty()) {
						// throw new SpagoBIServiceException(req.getPathInfo(),
						// "content Name already defined");
						jo.put("Status", "NON OK");
						jo.put("Message",
								"sbi.glossary.content.duplicate.content");
						return jo.toString();
					}
				}

			}

			if (requestVal.has("CONTENT_NM")) {
				// add contents to contents_parent
				if (((String) requestVal.opt("CONTENT_NM")).trim().isEmpty()) {
					jo.put("Status", "NON OK");
					jo.put("Message", "sbi.glossary.empty.content.name");
					return jo.toString();
				}
				Integer parentId = getNumberOrNull(requestVal.opt("PARENT_ID"));
				Integer glossaryId = getNumberOrNull(requestVal
						.opt("GLOSSARY_ID"));

				SbiGlContents cont = new SbiGlContents();
				cont.setContentNm((String) requestVal.opt("CONTENT_NM"));
				cont.setContentCd((String) requestVal.opt("CONTENT_CD"));
				cont.setContentDs((String) requestVal.opt("CONTENT_DS"));
				cont.setGlossaryId(glossaryId);
				cont.setParentId(parentId);
				id = dao.insertContents(cont);
				jo.put("Status", "OK");
				jo.put("id", id);
			} else {
				// add word to contents parent
				Integer parentId = getNumberOrNull(requestVal.opt("PARENT_ID"));
				Integer wordId = getNumberOrNull(requestVal.opt("WORD_ID"));
				Integer glossaryId = getNumberOrNull(requestVal.opt("GLOSSARY_ID"));

				List<SbiGlWlist> presWordInGloss = dao
						.listWlistByGlossaryIdAndWordId(glossaryId, wordId);
				if (!presWordInGloss.isEmpty()) {
					jo.put("Status", "NON OK");
					jo.put("Message", "sbi.glossary.content.duplicate.node");
				} else {

					SbiGlWlist contw = new SbiGlWlist();
					contw.setId(new SbiGlWlistId(wordId, parentId));
					// contw.setWordId(wordId);
					// contw.setContentId(parentId);

					SbiGlWlistId idw = dao.insertWlist(contw);
					if (idw == null) {
						jo.put("Status", "NON OK");
						jo.put("Message", "sbi.glossary.content.duplicate.node");
					} else {
						jo.put("Status", "OK");
					}
				}
			}

			return jo.toString();

		} catch (Throwable t) {
			// throw new SpagoBIServiceException(req.getPathInfo(),
			// "An unexpected error occured while executing service", t);
			try {
				jo.put("Status", "NON OK");
				jo.put("Message", "sbi.glossary.content.load.error");
				
				if (t.getMessage() == null) {
					jo.put("Error_text", "ERRORE SCONOSCIUTO");
				}else{
					if (t.getCause().getMessage() != null) {
						if (t.getCause().getCause().getMessage() != null) {
							jo.put("Error_text", t.getCause().getCause().getMessage());
						} else{
						jo.put("Error_text", t.getCause().getMessage());
						}
					} else {
						jo.put("Error_text", t.getMessage());
					}
					
				}
				
				
				
				
			} catch (JSONException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}

			return jo.toString();
		}
	}

	
	
	@POST
	@Path("/addDocWlist")
	@Produces(MediaType.APPLICATION_JSON)
	public String addDocWlist(@Context HttpServletRequest req) {
		JSONObject jo = new JSONObject();
		try {
			System.out.println("addDocWlist");
			IGlossaryDAO dao = DAOFactory.getGlossaryDAO();
			IEngUserProfile profile = (IEngUserProfile) req.getSession()
					.getAttribute(IEngUserProfile.ENG_USER_PROFILE);
			// TODO check if profile is null
			dao.setUserProfile(profile);

			JSONObject requestVal = RestUtilities.readBodyAsJSONObject(req);
			Integer wordId = getNumberOrNull(requestVal.opt("WORD_ID"));
			Integer documentId = getNumberOrNull(requestVal.opt("DOCUMENT_ID"));
			
			
			SbiGlDocWlist docwl=new SbiGlDocWlist();
			docwl.setId(new SbiGlDocWlistId(wordId, documentId));
			dao.insertDocWlist(docwl);
			
			

		} catch (Throwable t) {
			 throw new SpagoBIServiceException(req.getPathInfo(),
			 "An unexpected error occured while executing service", t);
		}
		return jo.toString();
	}
	
	
	
	@POST
	@Path("/addWord")
	@Produces(MediaType.APPLICATION_JSON)
	public String newWord(@Context HttpServletRequest req) {
		JSONObject jo = new JSONObject();
		try {
			System.out.println("newWord");
			IGlossaryDAO dao = DAOFactory.getGlossaryDAO();
			IEngUserProfile profile = (IEngUserProfile) req.getSession()
					.getAttribute(IEngUserProfile.ENG_USER_PROFILE);
			// TODO check if profile is null
			dao.setUserProfile(profile);
			System.out.println(req.toString());
			JSONObject requestVal = RestUtilities.readBodyAsJSONObject(req);

			SbiGlWord word;

			if (((String) requestVal.opt("WORD")).trim().isEmpty()) {
				jo.put("Status", "NON OK");
				jo.put("Message", "sbi.glossary.empty.word.name");
				return jo.toString();
			}

			boolean update = false;
			// check uniqueness of name
			List<SbiGlWord> lg = dao.loadWordByName((String) requestVal
					.opt("WORD"));
			if (((String) requestVal.opt("SaveOrUpdate")).compareTo("Save") == 0) {

				if (!lg.isEmpty()) {
					// throw new SpagoBIServiceException(req.getPathInfo(),
					// "Word Name already defined");
					jo.put("Status", "NON OK");
					jo.put("Message", "sbi.glossary.word.new.name.duplicate");
					return jo.toString();
				}
				word = new SbiGlWord();
			} else {
				// >1 because currently there is only the word that I want to
				// change
				if (lg.size() > 1) {
					// throw new SpagoBIServiceException(req.getPathInfo(),
					// "Word Name already defined");
					jo.put("Status", "NON OK");
					jo.put("Message", "sbi.glossary.word.new.name.duplicate");
					return jo.toString();
				}
				update = true;
				word = dao.loadWord(getNumberOrNull(requestVal.opt("WORD_ID")));
			}

			word.setWord((String) requestVal.opt("WORD"));
			word.setState((String) requestVal.opt("STATE"));
			word.setCategory((String) requestVal.opt("CATEGORY"));
			word.setDescr((String) requestVal.opt("DESCR"));
			word.setFormula((String) requestVal.opt("FORMULA"));
			JSONArray refe = (JSONArray) requestVal.opt("LINK");
			JSONArray attr = (JSONArray) requestVal.opt("SBI_GL_WORD_ATTR");

			Map<Integer, JSONObject> MapLink = new HashMap<Integer, JSONObject>();
			List<SbiGlWord> objLink = null;
			if (refe.length() != 0) {
				Object[] link = new Object[refe.length()];
				for (int i = 0; i < refe.length(); i++) {
					link[i] = refe.getJSONObject(i).getInt("WORD_ID");
					MapLink.put(refe.getJSONObject(i).getInt("WORD_ID"),
							refe.getJSONObject(i));
				}
				objLink = dao.listWordFromArray(link);
			}

			Map<Integer, JSONObject> MapAttr = new HashMap<Integer, JSONObject>();

			List<SbiGlAttribute> objAttr = null;
			if (attr.length() != 0) {
				Object[] att = new Object[attr.length()];
				for (int i = 0; i < attr.length(); i++) {

					if (attr.getJSONObject(i).getString("VALUE").trim()
							.isEmpty()) {
						jo.put("Status", "NON OK");
						jo.put("Message", "sbi.glossary.empty.attribute.name");
						return jo.toString();
					}

					att[i] = attr.getJSONObject(i).getInt("ATTRIBUTE_ID");
					MapAttr.put(attr.getJSONObject(i).getInt("ATTRIBUTE_ID"),
							attr.getJSONObject(i));
				}
				objAttr = dao.listAttrFromArray(att);
			}

			Integer id = dao.insertWord(word, objLink, objAttr, MapAttr,
					MapLink, update);

			jo.put("Status", "OK");
			jo.put("id", id);
			return jo.toString();

		} catch (Throwable t) {
			// throw new SpagoBIServiceException(req.getPathInfo(),
			// "An unexpected error occured while executing service", t);

			try {
				jo.put("Status", "NON OK");
				jo.put("Message", "sbi.glossary.word.save.error");
				jo.put("Error_text", t.getMessage());
			} catch (JSONException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}

			return jo.toString();
		}
	}

	@POST
	@Path("/deleteWord")
	@Produces(MediaType.APPLICATION_JSON)
	public String deleteWord(@Context HttpServletRequest req) {
		try {
			System.out.println("deleteWord");
			IGlossaryDAO dao = DAOFactory.getGlossaryDAO();
			IEngUserProfile profile = (IEngUserProfile) req.getSession()
					.getAttribute(IEngUserProfile.ENG_USER_PROFILE);
			// TODO check if profile is null
			dao.setUserProfile(profile);
			Integer wordId = getNumberOrNull(req.getParameter("WORD_ID"));

			// dao.deleteWordReferences(wordId);
			dao.deleteWord(wordId);

			JSONObject jo = new JSONObject();
			jo.put("Status", "OK");
			return jo.toString();

		} catch (Throwable t) {
			throw new SpagoBIServiceException(req.getPathInfo(),
					"An unexpected error occured while executing service", t);
		}
	}

	@POST
	@Path("/deleteDocWlist")
	@Produces(MediaType.APPLICATION_JSON)
	public String deleteDocWlist(@Context HttpServletRequest req) {
		try {
			System.out.println("deleteDocWlist");
			IGlossaryDAO dao = DAOFactory.getGlossaryDAO();
			IEngUserProfile profile = (IEngUserProfile) req.getSession()
					.getAttribute(IEngUserProfile.ENG_USER_PROFILE);
			// TODO check if profile is null
			dao.setUserProfile(profile);
			Integer wordId = getNumberOrNull(req.getParameter("WORD_ID"));
			Integer documentId = getNumberOrNull(req.getParameter("DOCUMENT_ID"));
			
			
			SbiGlDocWlistId id=new SbiGlDocWlistId(wordId,  documentId);
			
			dao.deleteDocWlist(id);

			JSONObject jo = new JSONObject();
			jo.put("Status", "OK");
			return jo.toString();

		} catch (Throwable t) {
			throw new SpagoBIServiceException(req.getPathInfo(),
					"An unexpected error occured while executing service", t);
		}
	}
	
	@POST
	@Path("/deleteGlossary")
	@Produces(MediaType.APPLICATION_JSON)
	public String deleteGlossary(@Context HttpServletRequest req) {
		try {
			System.out.println("deleteGlossary");
			IGlossaryDAO dao = DAOFactory.getGlossaryDAO();
			IEngUserProfile profile = (IEngUserProfile) req.getSession()
					.getAttribute(IEngUserProfile.ENG_USER_PROFILE);
			// TODO check if profile is null
			dao.setUserProfile(profile);
			Integer glossaryId = getNumberOrNull(req
					.getParameter("GLOSSARY_ID"));

			dao.deleteGlossary(glossaryId);

			JSONObject jo = new JSONObject();
			jo.put("Status", "OK");
			return jo.toString();

		} catch (Throwable t) {
			throw new SpagoBIServiceException(req.getPathInfo(),
					"An unexpected error occured while executing service", t);
		}
	}

	@POST
	@Path("/deleteContents")
	@Produces(MediaType.APPLICATION_JSON)
	public String deleteContents(@Context HttpServletRequest req) {
		try {
			System.out.println("deleteContents");
			IGlossaryDAO dao = DAOFactory.getGlossaryDAO();
			IEngUserProfile profile = (IEngUserProfile) req.getSession()
					.getAttribute(IEngUserProfile.ENG_USER_PROFILE);
			// TODO check if profile is null
			dao.setUserProfile(profile);

			Integer contentId = getNumberOrNull(req.getParameter("CONTENTS_ID"));
			if (contentId != null) {
				dao.deleteContents(contentId);
			} else {
				Integer parentId = getNumberOrNull(req
						.getParameter("PARENT_ID"));
				Integer wordId = getNumberOrNull(req.getParameter("WORD_ID"));
				dao.deleteWlist(new SbiGlWlistId(wordId, parentId));

			}

			JSONObject jo = new JSONObject();
			jo.put("Status", "OK");
			return jo.toString();

		} catch (Throwable t) {
			throw new SpagoBIServiceException(req.getPathInfo(),
					"An unexpected error occured while executing service", t);
		}
	}

	@GET
	@Path("/listAttribute")
	@Produces(MediaType.APPLICATION_JSON)
	public String listAttribute(@Context HttpServletRequest req) {
		try {
			System.out.println("listAttribute");
			IGlossaryDAO dao = DAOFactory.getGlossaryDAO();
			IEngUserProfile profile = (IEngUserProfile) req.getSession()
					.getAttribute(IEngUserProfile.ENG_USER_PROFILE);
			// TODO check if profile is null
			dao.setUserProfile(profile);

			String attrib = req.getParameter("ATTR");
			List<SbiGlAttribute> lst = null;
			if (attrib != null && !attrib.trim().isEmpty()) {
				lst = dao.listAttributeFiltered(attrib);
			} else {
				lst = dao.listAttribute();
			}

			JSONArray jarr = new JSONArray();
			if (lst != null) {
				for (Iterator<SbiGlAttribute> iterator = lst.iterator(); iterator
						.hasNext();) {
					SbiGlAttribute SbiGlAttribute = iterator.next();
					jarr.put(fromAttrLight(SbiGlAttribute));
				}
			}
			return jarr.toString();
		} catch (Throwable t) {
			throw new SpagoBIServiceException(req.getPathInfo(),
					"An unexpected error occured while executing service", t);
		}
	}

	@GET
	@Path("/listContents")
	@Produces(MediaType.APPLICATION_JSON)
	public String listContents(@Context HttpServletRequest req) {
		try {
			IGlossaryDAO dao = DAOFactory.getGlossaryDAO();
			IEngUserProfile profile = (IEngUserProfile) req.getSession()
					.getAttribute(IEngUserProfile.ENG_USER_PROFILE);
			// TODO check if profile is null
			dao.setUserProfile(profile);
			Integer glossaryId = getNumberOrNull(req
					.getParameter("GLOSSARY_ID"));
			Integer parentId = getNumberOrNull(req.getParameter("PARENT_ID"));

			List<SbiGlContents> lst = dao.listContentsByGlossaryIdAndParentId(
					glossaryId, parentId);

			JSONArray jarr = new JSONArray();
			if (lst != null) {
				for (Iterator<SbiGlContents> iterator = lst.iterator(); iterator
						.hasNext();) {
					SbiGlContents sbiGlContents = iterator.next(); 
					Integer wordCount=dao.CountWlistByContent(sbiGlContents.getContentId());
					Integer ContentCount=dao.CountContentChild(sbiGlContents.getContentId());
					jarr.put(fromContentsLight(sbiGlContents,(wordCount>0), (ContentCount>0)));
				}
			}

			if (parentId != null) {
				List<SbiGlWord> lstw = dao.listWlistWord(parentId);
				if (lstw != null) {
					for (SbiGlWord wl : lstw) {
						jarr.put(fromWordLight(wl));
					}
				}

			}

			return jarr.toString();
		} catch (Throwable t) {
			throw new SpagoBIServiceException(req.getPathInfo(),
					"An unexpected error occured while executing service", t);
		}
	}

	@GET
	@Path("/listGlossary")
	@Produces(MediaType.APPLICATION_JSON)
	public String listGlossary(@Context HttpServletRequest req) {
		try {
			IGlossaryDAO dao = DAOFactory.getGlossaryDAO();
			IEngUserProfile profile = (IEngUserProfile) req.getSession()
					.getAttribute(IEngUserProfile.ENG_USER_PROFILE);
			// TODO check if profile is null
			dao.setUserProfile(profile);
			List<SbiGlGlossary> lst = dao.listGlossary();
			JSONArray jarr = new JSONArray();
			if (lst != null) {
				for (Iterator<SbiGlGlossary> iterator = lst.iterator(); iterator
						.hasNext();) {
					SbiGlGlossary sbiGlGlossary = iterator.next();
					jarr.put(fromGlossaryLight(sbiGlGlossary));
				}
			}
			return jarr.toString();
		} catch (Throwable t) {
			throw new SpagoBIServiceException(req.getPathInfo(),
					"An unexpected error occured while executing service", t);
		}
	}

	@GET
	@Path("/listDocument")
	@Produces(MediaType.APPLICATION_JSON)
	public String listDocument(@Context HttpServletRequest req) {
		try {
			IBIObjectDAO sbiObjectsDAO = DAOFactory.getBIObjectDAO();
			IEngUserProfile profile = (IEngUserProfile) req.getSession()
					.getAttribute(IEngUserProfile.ENG_USER_PROFILE);
			// TODO check if profile is null
			sbiObjectsDAO.setUserProfile(profile);
			List<BIObject> lst = sbiObjectsDAO.loadAllBIObjects();
			JSONArray jarr = new JSONArray();
			if (lst != null) {
				for (Iterator<BIObject> iterator = lst.iterator(); iterator
						.hasNext();) {
					BIObject sbiob = iterator.next();
					jarr.put(fromDocumentLight(sbiob));
				}
			}
			return jarr.toString();
		} catch (Throwable t) {
			throw new SpagoBIServiceException(req.getPathInfo(),
					"An unexpected error occured while executing service", t);
		}
	}

	
	
	@GET
	@Path("/listWords")
	@Produces(MediaType.APPLICATION_JSON)
	public String listWords(@Context HttpServletRequest req) {
		try {
			IGlossaryDAO dao = DAOFactory.getGlossaryDAO();
			IEngUserProfile profile = (IEngUserProfile) req.getSession().getAttribute(IEngUserProfile.ENG_USER_PROFILE);
			// TODO check if profile is null
			dao.setUserProfile(profile);
			String word = req.getParameter("WORD");
			Integer page = getNumberOrNull(req.getParameter("Page"));
			Integer itempp = getNumberOrNull(req.getParameter("ItemPerPage"));
			
			
			List<SbiGlWord> lst = null;
			if (word != null && !word.trim().isEmpty()) {
				lst = dao.listWordFiltered(word,page,itempp);
			} else {
				lst = dao.listWord(page,itempp);
			}
			JSONArray jarr = new JSONArray();
			if (lst != null) {
				for (Iterator<SbiGlWord> iterator = lst.iterator(); iterator.hasNext();) {
					SbiGlWord sbiGlWord = iterator.next();
					jarr.put(fromWordLight(sbiGlWord));
				}
			}
			
			if(page!=null && itempp!=null ){
				JSONObject fin=new JSONObject();
				fin.put("item", jarr);
				fin.put("itemCount", dao.wordCount(word));
				return fin.toString();
			}
			
			return jarr.toString();
		} catch (Throwable t) {
			throw new SpagoBIServiceException(req.getPathInfo(),
					"An unexpected error occured while executing service", t);
		}
	}

	@GET
	@Path("/getDocumentInfo")
	@Produces(MediaType.APPLICATION_JSON)
	public String getDocumentInfo(@Context HttpServletRequest req) {
		
		try {
			IGlossaryDAO dao = DAOFactory.getGlossaryDAO();
			IEngUserProfile profile = (IEngUserProfile) req.getSession()
					.getAttribute(IEngUserProfile.ENG_USER_PROFILE);
			dao.setUserProfile(profile);
			
			Integer documentId = getNumberOrNull(req.getParameter("DOCUMENT_ID"));
			if (documentId==null) {
				throw new SpagoBIServiceException(req.getPathInfo(),
						"Input param Id [" + documentId + "] not valid or null");
			}
			
			List<SbiGlDocWlist> listDocWlist=dao.listDocWlist(documentId);
			
			JSONObject jobj =new JSONObject();
			JSONArray ja=new JSONArray();
			for(SbiGlDocWlist sb:listDocWlist){
				ja.put(fromWordLight(sb.getWord()));
			}
			jobj.put("word", ja);
			
			
			return jobj.toString();
		} catch (Throwable t) {
			throw new SpagoBIServiceException(req.getPathInfo(),
					"An unexpected error occured while executing service", t);
		}
	}
	
	@GET
	@Path("/getWord")
	@Produces(MediaType.APPLICATION_JSON)
	public String getWord(@Context HttpServletRequest req) {
		String id = req.getParameter("WORD_ID");
		if (!id.matches("\\d+")) {
			throw new SpagoBIServiceException(req.getPathInfo(),
					"Input param Id [" + id + "] not valid");
		}
		try {
			IGlossaryDAO dao = DAOFactory.getGlossaryDAO();
			IEngUserProfile profile = (IEngUserProfile) req.getSession()
					.getAttribute(IEngUserProfile.ENG_USER_PROFILE);
			dao.setUserProfile(profile);
			SbiGlWord word = dao.loadWord(Integer.valueOf(id));
			JSONObject jobj = from(word);
			return jobj.toString();
		} catch (Throwable t) {
			throw new SpagoBIServiceException(req.getPathInfo(),
					"An unexpected error occured while executing service", t);
		}
	}

	@GET
	@Path("/getGlossary")
	@Produces(MediaType.APPLICATION_JSON)
	public String getGlossary(@Context HttpServletRequest req) {
		String glossaryId = req.getParameter("GLOSSARY_ID");
		if (!glossaryId.matches("\\d+")) {
			throw new SpagoBIServiceException(req.getPathInfo(),
					"Input param Id [" + glossaryId + "] not valid");
		}
		try {
			IGlossaryDAO dao = DAOFactory.getGlossaryDAO();
			IEngUserProfile profile = (IEngUserProfile) req.getSession()
					.getAttribute(IEngUserProfile.ENG_USER_PROFILE);
			dao.setUserProfile(profile);

			SbiGlGlossary glo = dao.loadGlossary(Integer.valueOf(glossaryId));
			JSONObject jobj = fromGlossary(glo);
			return jobj.toString();
		} catch (Throwable t) {
			throw new SpagoBIServiceException(req.getPathInfo(),
					"An unexpected error occured while executing service", t);
		}
	}

	@GET
	@Path("/getContent")
	@Produces(MediaType.APPLICATION_JSON)
	public String getContents(@Context HttpServletRequest req) {
		String contentId = req.getParameter("CONTENT_ID");
		if (!contentId.matches("\\d+")) {
			throw new SpagoBIServiceException(req.getPathInfo(),
					"Input param Id [" + contentId + "] not valid");
		}
		try {
			IGlossaryDAO dao = DAOFactory.getGlossaryDAO();
			IEngUserProfile profile = (IEngUserProfile) req.getSession()
					.getAttribute(IEngUserProfile.ENG_USER_PROFILE);
			dao.setUserProfile(profile);

			SbiGlContents cont = dao.loadContents(Integer.valueOf(contentId));
			JSONObject jobj = fromContent(cont);
			return jobj.toString();
		} catch (Throwable t) {
			throw new SpagoBIServiceException(req.getPathInfo(),
					"An unexpected error occured while executing service", t);
		}
	}

	@POST
	@Path("/cloneGlossary")
	@Produces(MediaType.APPLICATION_JSON)
	public String cloneGlossary(@Context HttpServletRequest req) {
		try {
			System.out.println("cloneGlossary");
			IGlossaryDAO dao = DAOFactory.getGlossaryDAO();
			IEngUserProfile profile = (IEngUserProfile) req.getSession()
					.getAttribute(IEngUserProfile.ENG_USER_PROFILE);
			// TODO check if profile is null
			dao.setUserProfile(profile);

			JSONObject requestVal = RestUtilities.readBodyAsJSONObject(req);

			Integer glossaryId = (Integer) requestVal.opt("GLOSSARY_ID");

			if (glossaryId == null) {
				throw new SpagoBIServiceException(req.getPathInfo(),
						"ID non puo essere null");
			}

			// check if name is present
			String gn = (String) requestVal.opt("GLOSSARY_NM");
			if (gn.trim().isEmpty()) {
				throw new SpagoBIServiceException(req.getPathInfo(),
						"Glossary name is request");
			}
			// get glossary
			SbiGlGlossary glo = dao.loadGlossary(glossaryId);
			if (glo == null) {
				throw new SpagoBIServiceException(req.getPathInfo(),
						"Glossary not present");
			}

			// check if there is another glossary with the same name
			List<SbiGlGlossary> lg = dao.loadGlossaryByName((String) requestVal
					.opt("GLOSSARY_NM"));
			if (!lg.isEmpty()) {
				throw new SpagoBIServiceException(req.getPathInfo(),
						"Glossary Name already defined");
			}

			glo.setGlossaryNm((String) requestVal.opt("GLOSSARY_NM"));
			glo.setGlossaryCd((String) requestVal.opt("GLOSSARY_CD"));
			glo.setGlossaryDs((String) requestVal.opt("GLOSSARY_DS"));
			Integer newGlossId = dao.insertGlossary(glo);

			dao.cloneGlossary(glossaryId, newGlossId);

			JSONObject jo = new JSONObject();
			jo.put("Status", "OK");
			jo.put("id", newGlossId);
			return jo.toString();

		} catch (Throwable t) {
			throw new SpagoBIServiceException(req.getPathInfo(),
					"An unexpected error occured while executing service", t);
		}
	}


	@GET
	@Path("/glosstreeLike")
	@Produces(MediaType.APPLICATION_JSON)
	public String glosstreeLike(@Context HttpServletRequest req) {

		try {
			IGlossaryDAO dao = DAOFactory.getGlossaryDAO();
			IEngUserProfile profile = (IEngUserProfile) req.getSession()
					.getAttribute(IEngUserProfile.ENG_USER_PROFILE);
			dao.setUserProfile(profile);
			JSONObject jo = new JSONObject();
			
			String word = req.getParameter("WORD");
			String glossaryId = req.getParameter("GLOSSARY_ID");
			JSONObject fin=new JSONObject();
			
			if(word.trim().isEmpty()){
				SbiGlGlossary gl=dao.loadGlossary(Integer.parseInt(glossaryId));
				fin=fromGlossaryLight(gl);
				fin.put("SBI_GL_CONTENTS", JSON.parse(this.listContents(req)));
				}else{
					fin=dao.glosstreeLike(glossaryId,word);
				}
					
			jo.put("Status", "OK");
			jo.put("GlossSearch", fin);
			return jo.toString();
		} catch (Throwable t) {
			throw new SpagoBIServiceException(req.getPathInfo(),
					"An unexpected error occured while executing service", t);
		}
	}

	
	private static JSONObject fromWordLight(SbiGlWord sbiGlWord)
			throws JSONException {
		JSONObject jobj = new JSONObject();
		jobj.put("WORD_ID", sbiGlWord.getWordId());
		jobj.put("WORD", sbiGlWord.getWord());
		return jobj;
	}

	private static JSONObject fromAttrLight(SbiGlAttribute SbiGlAttribute)
			throws JSONException {
		JSONObject jobj = new JSONObject();
		jobj.put("ATTRIBUTE_ID", SbiGlAttribute.getAttributeId());
		jobj.put("ATTRIBUTE_NM", SbiGlAttribute.getAttributeNm());
		return jobj;
	}

	private static JSONObject from(SbiGlWord word) throws JSONException {
		JSONObject obj = new JSONObject();

		obj.put("WORD_ID", word.getWordId());
		obj.put("WORD", word.getWord());
		obj.put("DESCR", word.getDescr());
		obj.put("FORMULA", word.getFormula());
		obj.put("STATE", word.getState());
		obj.put("CATEGORY", word.getCategory());
		JSONArray links = new JSONArray();
		if (word.getReferences() != null) {
			for (Iterator<SbiGlReferences> iterator = word.getReferences()
					.iterator(); iterator.hasNext();) {
				SbiGlReferences refWord = iterator.next();
				links.put(fromWordLight(refWord.getRefWord()));
			}
			obj.put("LINK", links);
		}
		JSONArray attrs = new JSONArray();
		if (word.getAttributes() != null) {
			for (Iterator<SbiGlWordAttr> iterator = word.getAttributes()
					.iterator(); iterator.hasNext();) {
				SbiGlWordAttr attr = iterator.next();
				JSONObject jsonAttr = new JSONObject();
				jsonAttr.put("ATTRIBUTE_ID", attr.getAttribute()
						.getAttributeId());
				jsonAttr.put("ATTRIBUTE_NM", attr.getAttribute()
						.getAttributeNm());
				jsonAttr.put("VALUE", attr.getValue());
				attrs.put(jsonAttr);
			}
			obj.put("SBI_GL_WORD_ATTR", attrs);
		}
		return obj;
	}

	private JSONObject fromGlossaryLight(SbiGlGlossary sbiGlGlossary)

	throws JSONException {
		JSONObject ret = new JSONObject();
		ret.put("GLOSSARY_ID", sbiGlGlossary.getGlossaryId());
		ret.put("GLOSSARY_NM", sbiGlGlossary.getGlossaryNm());
		return ret;
	}

	private JSONObject fromGlossary(SbiGlGlossary sbiGlGlossary)
			throws JSONException {
		JSONObject ret = new JSONObject();
		ret.put("GLOSSARY_ID", sbiGlGlossary.getGlossaryId());
		ret.put("GLOSSARY_NM", sbiGlGlossary.getGlossaryNm());
		ret.put("GLOSSARY_CD", sbiGlGlossary.getGlossaryCd());
		ret.put("GLOSSARY_DS", sbiGlGlossary.getGlossaryDs());
		return ret;
	}

	private JSONObject fromContent(SbiGlContents sbiGlContents)
			throws JSONException {
		JSONObject ret = new JSONObject();
		ret.put("CONTENT_ID", sbiGlContents.getGlossaryId());
		ret.put("CONTENT_NM", sbiGlContents.getContentNm());
		ret.put("CONTENT_CD", sbiGlContents.getContentCd());
		ret.put("CONTENT_DS", sbiGlContents.getContentDs());
		return ret;
	}
	
	private JSONObject fromDocumentLight(BIObject sbiob)
			throws JSONException {
		JSONObject ret = new JSONObject();
		ret.put("DOCUMENT_ID", sbiob.getId());
		ret.put("DOCUMENT_NM", sbiob.getLabel());
		
		return ret;
	}

	public static void main(String[] args) {
		try {
			SbiGlWord refw = new SbiGlWord(2, "test2", "primo test2", "fffff2",
					"S", "cat01");
			SbiGlWord obj = new SbiGlWord(1, "test", "primo test", "fffff",
					"S", "cat01");
			obj.setReferences(new HashSet<SbiGlReferences>());
			obj.getReferences().add(
					new SbiGlReferences(new SbiGlReferencesId(1, refw
							.getWordId()), obj, refw, 1));
			obj.setAttributes(new HashSet<SbiGlWordAttr>());
			SbiGlAttribute attribute = new SbiGlAttribute(1, "attributeCd",
					"attr name", "attributeDs", 1, "type", "domain", "format",
					"displayTp", "1");
			obj.getAttributes().add(
					new SbiGlWordAttr(new SbiGlWordAttrId(1, 1), obj,
							attribute, "attr 1 value", 1));
			JSONObject jobj = new JSONObject().put("aaa", obj);// from(obj);
			System.out.println(jobj.toString());
		} catch (Exception e) {
			e.printStackTrace();
		}

	}
}
