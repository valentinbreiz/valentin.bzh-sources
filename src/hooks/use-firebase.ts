import { doc, runTransaction, getFirestore, getDoc } from 'firebase/firestore';
import app from '../firebaseConfig';

const useFirebase = () => {
  const firestoreInstance = getFirestore(app);

  const getViewCount = async (articleId: number): Promise<number> => {
    const articleRef = doc(firestoreInstance, 'articles', articleId.toString());

    try {
      const articleDoc = await getDoc(articleRef);

      if (articleDoc.exists()) {
        const articleData = articleDoc.data();
        return articleData.views || 0;
      } else {
        return 0;
      }
    } catch (error) {
      console.error("Error getting view count: ", error);
      return 0;
    }
  };

  const increaseViewCount = async (articleId: number): Promise<void> => {
    const articleRef = doc(firestoreInstance, 'articles', articleId.toString());
  
    try {
      await runTransaction(firestoreInstance, async (transaction) => {
        const articleDoc = await transaction.get(articleRef);
  
        if (!articleDoc.exists()) {
          transaction.set(articleRef, { views: 1 });
        } else {
          const newViews = (articleDoc.data().views || 0) + 1;
          transaction.update(articleRef, { views: newViews });
        }
      });
    } catch (error) {
      console.error("Error incrementing view count: ", error);
    }
  };
  

  return {
    increaseViewCount,
    getViewCount
  };
};

export default useFirebase;
